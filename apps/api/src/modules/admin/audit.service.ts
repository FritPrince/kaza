import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

/** Every sensitive back-office action goes through here (§G8). */
@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  log(
    adminId: string,
    action: string,
    targetEntity: string,
    targetId?: string,
    details?: Record<string, unknown>,
  ) {
    return this.prisma.auditLog.create({
      data: { adminId, action, targetEntity, targetId, details: details as Prisma.InputJsonValue },
    });
  }
}
