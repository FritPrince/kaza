import { Injectable, NotFoundException } from '@nestjs/common';
import type { SubmitTasteQuizInput, UpdateProfileInput } from '@kaza/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        displayName: true,
        language: true,
        country: true,
        currency: true,
        credits: true,
        plan: true,
        createdAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  updateProfile(userId: string, input: UpdateProfileInput) {
    return this.prisma.user.update({
      where: { id: userId },
      data: input,
      select: { id: true, displayName: true, language: true, country: true, currency: true },
    });
  }

  /**
   * Derives the initial style profile from quiz swipes (§A2). The mobile app
   * tags each quiz image with styles server-side; liked images vote for their
   * styles, and the top styles become the profile.
   */
  async submitTasteQuiz(userId: string, input: SubmitTasteQuizInput) {
    const likedImageIds = input.swipes.filter((s) => s.liked).map((s) => s.imageId);
    const favoriteStyles = await this.deriveStylesFromImages(likedImageIds);
    return this.prisma.tasteProfile.upsert({
      where: { userId },
      update: { favoriteStyles, swipeHistory: input.swipes },
      create: { userId, favoriteStyles, palette: [], swipeHistory: input.swipes },
    });
  }

  async getTasteProfile(userId: string) {
    const profile = await this.prisma.tasteProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new NotFoundException('Taste profile not created yet');
    }
    return profile;
  }

  async registerPushToken(userId: string, expoPushToken: string) {
    await this.prisma.user.update({ where: { id: userId }, data: { expoPushToken } });
    return { registered: true };
  }

  /** GDPR: cascading delete removes projects, generations, conversations and tokens. */
  async deleteAccount(userId: string) {
    await this.prisma.user.delete({ where: { id: userId } });
    return { deleted: true };
  }

  private async deriveStylesFromImages(imageIds: string[]): Promise<string[]> {
    if (imageIds.length === 0) {
      return [];
    }
    // Quiz images and their style tags live in app_settings (managed by the CMS, §G5).
    const setting = await this.prisma.appSetting.findUnique({ where: { key: 'taste-quiz-images' } });
    const catalogue = (setting?.value ?? []) as Array<{ id: string; styles: string[] }>;
    const votes = new Map<string, number>();
    for (const image of catalogue.filter((img) => imageIds.includes(img.id))) {
      for (const style of image.styles) {
        votes.set(style, (votes.get(style) ?? 0) + 1);
      }
    }
    return [...votes.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([style]) => style);
  }
}
