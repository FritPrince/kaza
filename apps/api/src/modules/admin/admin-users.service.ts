import { Injectable, NotFoundException } from '@nestjs/common';
import type { AdjustCreditsInput, SuspendUserInput } from '@kaza/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async search(q: string | undefined, page: number, pageSize: number) {
    const where = q
      ? {
          OR: [
            { email: { contains: q, mode: 'insensitive' as const } },
            { phone: { contains: q } },
            { displayName: { contains: q, mode: 'insensitive' as const } },
          ],
        }
      : {};
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          phone: true,
          displayName: true,
          country: true,
          credits: true,
          plan: true,
          suspendedAt: true,
          createdAt: true,
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items, total, page, pageSize };
  }

  async getDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        projects: { orderBy: { updatedAt: 'desc' } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 20 },
        tasteProfile: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const { passwordHash: _passwordHash, ...safe } = user;
    return safe;
  }

  async adjustCredits(adminId: string, input: AdjustCreditsInput) {
    const user = await this.prisma.user.update({
      where: { id: input.userId },
      data: { credits: { increment: input.delta } },
      select: { id: true, credits: true },
    });
    await this.audit.log(adminId, 'credits.adjust', 'user', input.userId, {
      delta: input.delta,
      reason: input.reason,
    });
    return user;
  }

  async suspend(adminId: string, input: SuspendUserInput) {
    const user = await this.prisma.user.update({
      where: { id: input.userId },
      data: { suspendedAt: new Date() },
      select: { id: true, suspendedAt: true },
    });
    await this.audit.log(adminId, 'user.suspend', 'user', input.userId, { reason: input.reason });
    return user;
  }

  async gdprDelete(adminId: string, userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    await this.audit.log(adminId, 'user.gdpr-delete', 'user', userId);
    return { deleted: true };
  }
}
