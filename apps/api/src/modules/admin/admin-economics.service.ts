import { Injectable } from '@nestjs/common';
import type { EconomicsDashboard } from '@kaza/shared';
import { PrismaService } from '../../prisma/prisma.service';

const PERIOD_DAYS: Record<EconomicsDashboard['period'], number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

/** Simplified conversion for the dashboard; refined with real FX rates later. */
const XOF_PER_USD = 600;

@Injectable()
export class AdminEconomicsService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboard(period: EconomicsDashboard['period']): Promise<EconomicsDashboard> {
    const since = new Date(Date.now() - PERIOD_DAYS[period] * 24 * 60 * 60 * 1000);

    const [revenueRows, aiCost, generationsCount, activeUsers] = await Promise.all([
      this.prisma.transaction.groupBy({
        by: ['type', 'channel'],
        where: { status: 'completed', createdAt: { gte: since } },
        _sum: { amount: true },
      }),
      this.prisma.generation.aggregate({
        where: { createdAt: { gte: since }, costUsd: { not: null } },
        _sum: { costUsd: true },
      }),
      this.prisma.generation.count({ where: { createdAt: { gte: since } } }),
      this.prisma.project.groupBy({ by: ['userId'], where: { updatedAt: { gte: since } } }),
    ]);

    const sumWhere = (predicate: (row: (typeof revenueRows)[number]) => boolean): number =>
      revenueRows.filter(predicate).reduce((acc, row) => acc + (row._sum.amount ?? 0), 0);

    const subscriptions = sumWhere((r) => r.type === 'subscription');
    const creditPacks = sumWhere((r) => r.type === 'credits');
    const mobileMoney = sumWhere((r) => r.channel === 'mobile_money');
    const total = subscriptions + creditPacks;

    const totalAiUsd = Number(aiCost._sum.costUsd ?? 0);
    const activeUserCount = activeUsers.length;
    const aiCostInXof = totalAiUsd * XOF_PER_USD;

    return {
      period,
      revenue: { subscriptions, creditPacks, mobileMoney, total },
      aiCosts: {
        totalUsd: totalAiUsd,
        perGenerationUsd: generationsCount > 0 ? totalAiUsd / generationsCount : 0,
        perActiveUserUsd: activeUserCount > 0 ? totalAiUsd / activeUserCount : 0,
      },
      grossMarginPercent: total > 0 ? Math.round(((total - aiCostInXof) / total) * 100) : 0,
      generationsCount,
      activeUsers: activeUserCount,
    };
  }
}
