import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { AuditService } from './audit.service';

@Injectable()
export class AdminModerationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly audit: AuditService,
  ) {}

  async list(status: 'pending' | 'approved' | 'rejected', page: number, pageSize: number) {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.moderationItem.findMany({
        where: { status },
        orderBy: { createdAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.moderationItem.count({ where: { status } }),
    ]);

    const withUrls = await Promise.all(
      items.map(async (item) => ({
        ...item,
        imageUrl: await this.storage.getDownloadUrl(item.imageKey).catch(() => null),
      })),
    );
    return { items: withUrls, total, page, pageSize };
  }

  async decide(
    adminId: string,
    itemId: string,
    status: 'approved' | 'rejected',
    decision: string,
  ) {
    const item = await this.prisma.moderationItem.findUnique({ where: { id: itemId } });
    if (!item) {
      throw new NotFoundException('Moderation item not found');
    }
    const updated = await this.prisma.moderationItem.update({
      where: { id: itemId },
      data: { status, decision, moderatorId: adminId, reviewedAt: new Date() },
    });
    await this.audit.log(adminId, `moderation.${status}`, 'moderation_item', itemId, { decision });
    return updated;
  }
}
