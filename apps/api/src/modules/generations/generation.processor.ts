import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { structuredPromptSchema } from '@kaza/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { GENERATION_QUEUE } from './generations.module';
import type { GenerationJobData } from './generations.service';
import { IMAGE_PROVIDER, type ImageProvider } from './providers/image-provider.interface';

/** BullMQ worker: pending → processing → done/failed with automatic retries (§7.2). */
@Processor(GENERATION_QUEUE)
export class GenerationProcessor extends WorkerHost {
  private readonly logger = new Logger(GenerationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(IMAGE_PROVIDER) private readonly imageProvider: ImageProvider,
  ) {
    super();
  }

  async process(job: Job<GenerationJobData>): Promise<void> {
    const { generationId } = job.data;
    const generation = await this.prisma.generation.findUniqueOrThrow({
      where: { id: generationId },
      include: { room: true },
    });

    await this.prisma.generation.update({
      where: { id: generationId },
      data: { status: 'processing' },
    });

    try {
      const result = await this.imageProvider.generate({
        sourceImageKey: generation.room.sourcePhotoKey ?? '',
        structuredPrompt: structuredPromptSchema.parse(generation.structuredPrompt),
      });
      await this.prisma.generation.update({
        where: { id: generationId },
        data: {
          status: 'done',
          imageKey: result.imageKey,
          costUsd: result.costUsd,
          provider: result.provider,
          completedAt: new Date(),
        },
      });
      // TODO: send Expo push notification "your render is ready" (§7.2).
    } catch (error) {
      const isLastAttempt = job.attemptsMade + 1 >= (job.opts.attempts ?? 1);
      if (isLastAttempt) {
        await this.markFailedAndRefund(generationId, error);
      }
      throw error;
    }
  }

  /** Terminal failure: mark failed and refund the credit so the user is never charged for nothing. */
  private async markFailedAndRefund(generationId: string, error: unknown): Promise<void> {
    this.logger.error(`Generation ${generationId} failed permanently`, error as Error);
    const generation = await this.prisma.generation.update({
      where: { id: generationId },
      data: {
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
      },
      include: { room: { include: { project: { select: { userId: true } } } } },
    });
    await this.prisma.user.update({
      where: { id: generation.room.project.userId },
      data: { credits: { increment: 1 } },
    });
  }
}
