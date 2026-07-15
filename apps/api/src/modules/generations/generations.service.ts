import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import type { AgentTurn, RequestGenerationInput } from '@kaza/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { InterviewAgentService } from './agent/interview-agent.service';
import { GENERATION_QUEUE } from './generations.module';

export interface GenerationJobData {
  generationId: string;
}

@Injectable()
export class GenerationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly interviewAgent: InterviewAgentService,
    private readonly storage: StorageService,
    @InjectQueue(GENERATION_QUEUE) private readonly queue: Queue<GenerationJobData>,
  ) {}

  /** One interview turn: persists the user message, asks the agent, persists its reply (B2). */
  async handleChatTurn(userId: string, roomId: string, content: string): Promise<AgentTurn> {
    const room = await this.getOwnedRoom(userId, roomId);

    const conversation =
      (await this.prisma.conversation.findFirst({ where: { roomId } })) ??
      (await this.prisma.conversation.create({ data: { roomId } }));

    await this.prisma.message.create({
      data: { conversationId: conversation.id, role: 'user', content },
    });

    const history = await this.prisma.message.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'asc' },
    });
    const tasteProfile = await this.prisma.tasteProfile.findUnique({ where: { userId } });

    const turn = await this.interviewAgent.nextTurn({
      roomType: room.type,
      constraints: room.constraints,
      tasteProfile,
      history: history.map((m) => ({ role: m.role, content: m.content })),
    });

    await this.prisma.message.create({
      data: {
        conversationId: conversation.id,
        role: 'assistant',
        content: turn.message,
        quickReplies: turn.kind === 'question' ? turn.quickReplies : undefined,
      },
    });

    return turn;
  }

  /**
   * Requests renders. Credits are decremented atomically BEFORE enqueueing so a
   * user cannot go negative with concurrent requests; failed jobs refund (§F1).
   */
  async requestGeneration(userId: string, input: RequestGenerationInput) {
    const room = await this.getOwnedRoom(userId, input.roomId);
    if (!room.sourcePhotoKey) {
      throw new NotFoundException('Room has no source photo yet');
    }

    const cost = input.variants;
    const decremented = await this.prisma.user.updateMany({
      where: { id: userId, credits: { gte: cost }, suspendedAt: null },
      data: { credits: { decrement: cost } },
    });
    if (decremented.count === 0) {
      // 402: the mobile app shows the soft paywall (§6.7).
      throw new HttpException('Not enough credits', HttpStatus.PAYMENT_REQUIRED);
    }

    const lastVersion = await this.prisma.generation.aggregate({
      where: { roomId: input.roomId },
      _max: { version: true },
    });
    const baseVersion = lastVersion._max.version ?? 0;

    const generations = await this.prisma.$transaction(
      Array.from({ length: input.variants }, (_, index) =>
        this.prisma.generation.create({
          data: {
            roomId: input.roomId,
            version: baseVersion + index + 1,
            parentGenerationId: input.parentGenerationId,
            structuredPrompt: input.structuredPrompt,
          },
        }),
      ),
    );

    await this.queue.addBulk(
      generations.map((generation) => ({
        name: 'generate',
        data: { generationId: generation.id },
        opts: { attempts: 3, backoff: { type: 'exponential', delay: 5000 } },
      })),
    );

    return { generations };
  }

  async getGeneration(userId: string, generationId: string) {
    const generation = await this.prisma.generation.findUnique({
      where: { id: generationId },
      include: { room: { include: { project: { select: { userId: true } } } } },
    });
    if (!generation) {
      throw new NotFoundException('Generation not found');
    }
    if (generation.room.project.userId !== userId) {
      throw new ForbiddenException('Not your generation');
    }
    const { room: _room, ...payload } = generation;
    return {
      ...payload,
      imageUrl: payload.imageKey ? await this.storage.getDownloadUrl(payload.imageKey) : null,
    };
  }

  async listRoomGenerations(userId: string, roomId: string) {
    await this.getOwnedRoom(userId, roomId);
    const generations = await this.prisma.generation.findMany({
      where: { roomId },
      orderBy: { version: 'asc' },
    });
    return Promise.all(
      generations.map(async (generation) => ({
        ...generation,
        imageUrl: generation.imageKey
          ? await this.storage.getDownloadUrl(generation.imageKey)
          : null,
      })),
    );
  }

  private async getOwnedRoom(userId: string, roomId: string) {
    const room = await this.prisma.room.findUnique({
      where: { id: roomId },
      include: { project: { select: { userId: true } } },
    });
    if (!room) {
      throw new NotFoundException('Room not found');
    }
    if (room.project.userId !== userId) {
      throw new ForbiddenException('Not your room');
    }
    return room;
  }
}
