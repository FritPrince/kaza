import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from './audit.service';

const KEY_PATTERN = /^[a-z0-9-]{2,64}$/;

@Injectable()
export class AdminSettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  list() {
    return this.prisma.appSetting.findMany({ orderBy: { key: 'asc' } });
  }

  async upsert(adminId: string, key: string, value: unknown) {
    if (!KEY_PATTERN.test(key)) {
      throw new BadRequestException('Setting key must be kebab-case (2-64 chars)');
    }
    const setting = await this.prisma.appSetting.upsert({
      where: { key },
      update: { value: value as Prisma.InputJsonValue },
      create: { key, value: value as Prisma.InputJsonValue },
    });
    await this.audit.log(adminId, 'settings.update', 'app_setting', key, {
      value: value as Record<string, unknown>,
    });
    return setting;
  }
}
