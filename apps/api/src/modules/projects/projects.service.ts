import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { CreateProjectInput, CreateRoomInput, UpdateProjectInput } from '@kaza/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

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
    return project;
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
