import { Injectable, Logger } from '@nestjs/common';
import { Expo } from 'expo-server-sdk';
import { PrismaService } from '../../prisma/prisma.service';

/** Expo push notifications — fired when a generation completes (§7.2). */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expo = new Expo();

  constructor(private readonly prisma: PrismaService) {}

  async notifyUser(userId: string, title: string, body: string, data?: Record<string, string>) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { expoPushToken: true },
    });
    const token = user?.expoPushToken;
    if (!token || !Expo.isExpoPushToken(token)) {
      return;
    }
    try {
      await this.expo.sendPushNotificationsAsync([{ to: token, title, body, data, sound: 'default' }]);
    } catch (error) {
      // Push failures must never break the generation pipeline.
      this.logger.warn(`Push notification failed for user ${userId}`, error as Error);
    }
  }
}
