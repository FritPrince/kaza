import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateProjectInput, CreateRoomInput, UpdateProjectInput } from '@kaza/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  listProjects(userId: string) {
    return this.prisma.project.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: { _count: { select: { rooms: true } } },
    });
  }

  async createProject(userId: string, input: CreateProjectInput) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.prisma.project.create({
      data: {
        userId,
        type: input.type,
        name: input.name,
        currency: input.currency ?? user.currency,
      },
    });
  }

  async getProject(userId: string, projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        rooms: {
          include: {
            generations: { orderBy: { version: 'desc' }, take: 1 },
          },
        },
      },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('Not your project');
    }
    // Storage keys stay private — clients receive time-limited signed URLs.
    const rooms = await Promise.all(
      project.rooms.map(async (room) => ({
        ...room,
        sourcePhotoUrl: room.sourcePhotoKey
          ? await this.storage.getDownloadUrl(room.sourcePhotoKey)
          : null,
        generations: await Promise.all(
          room.generations.map(async (generation) => ({
            ...generation,
            imageUrl: generation.imageKey
              ? await this.storage.getDownloadUrl(generation.imageKey)
              : null,
          })),
        ),
      })),
    );
    return { ...project, rooms };
  }

  async updateProject(userId: string, projectId: string, input: UpdateProjectInput) {
    await this.assertOwnership(userId, projectId);
    return this.prisma.project.update({ where: { id: projectId }, data: input });
  }

  async deleteProject(userId: string, projectId: string) {
    await this.assertOwnership(userId, projectId);
    await this.prisma.project.delete({ where: { id: projectId } });
    return { deleted: true };
  }

  async addRoom(userId: string, projectId: string, input: CreateRoomInput) {
    await this.assertOwnership(userId, projectId);
    return this.prisma.room.create({
      data: {
        projectId,
        type: input.type,
        name: input.name,
        constraints: input.constraints,
      },
    });
  }

  async getRoomDetail(userId: string, roomId: string) {
    const room = await this.getOwnedRoom(userId, roomId);
    const generations = await this.prisma.generation.findMany({
      where: { roomId },
      orderBy: { version: 'asc' },
    });
    return {
      ...room,
      sourcePhotoUrl: room.sourcePhotoKey
        ? await this.storage.getDownloadUrl(room.sourcePhotoKey)
        : null,
      generations: await Promise.all(
        generations.map(async (generation) => ({
          ...generation,
          imageUrl: generation.imageKey
            ? await this.storage.getDownloadUrl(generation.imageKey)
            : null,
        })),
      ),
    };
  }

  async createRoomPhotoUploadUrl(userId: string, roomId: string, contentType: string) {
    const room = await this.getOwnedRoom(userId, roomId);
    return this.storage.createUploadUrl(`rooms/${room.id}`, contentType);
  }

  async confirmRoomPhoto(userId: string, roomId: string, key: string) {
    const room = await this.getOwnedRoom(userId, roomId);
    if (!key.startsWith(`rooms/${room.id}/`)) {
      throw new ForbiddenException('Key does not belong to this room');
    }
    // TODO(§7.5): enqueue the image for automatic moderation before processing.
    const updated = await this.prisma.room.update({
      where: { id: roomId },
      data: { sourcePhotoKey: key },
    });
    return { ...updated, sourcePhotoUrl: await this.storage.getDownloadUrl(key) };
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

  private async assertOwnership(userId: string, projectId: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      select: { userId: true },
    });
    if (!project) {
      throw new NotFoundException('Project not found');
    }
    if (project.userId !== userId) {
      throw new ForbiddenException('Not your project');
    }
  }
}
