import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { createHash, randomInt } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { FREE_GENERATIONS_AT_SIGNUP, type AuthTokens, type EmailLoginInput, type EmailSignupInput } from '@kaza/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { SMS_PROVIDER, type SmsProvider } from './sms/sms-provider.interface';

const OTP_TTL_MS = 5 * 60 * 1000;
const OTP_MAX_ATTEMPTS = 5;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    @Inject(SMS_PROVIDER) private readonly smsProvider: SmsProvider,
  ) {}

  async requestOtp(phone: string): Promise<{ sent: boolean }> {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    await this.prisma.otpCode.create({
      data: {
        phone,
        codeHash: this.hash(code),
        expiresAt: new Date(Date.now() + OTP_TTL_MS),
      },
    });
    await this.smsProvider.sendOtp(phone, code);
    return { sent: true };
  }

  async verifyOtp(phone: string, code: string): Promise<AuthTokens> {
    const otp = await this.prisma.otpCode.findFirst({
      where: { phone, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: 'desc' },
    });
    if (!otp || otp.attempts >= OTP_MAX_ATTEMPTS) {
      throw new UnauthorizedException('OTP expired or too many attempts');
    }
    if (otp.codeHash !== this.hash(code)) {
      await this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP code');
    }
    await this.prisma.otpCode.delete({ where: { id: otp.id } });

    const user = await this.prisma.user.upsert({
      where: { phone },
      update: {},
      create: { phone, credits: FREE_GENERATIONS_AT_SIGNUP },
    });
    return this.issueTokens(user.id);
  }

  async signupWithEmail(input: EmailSignupInput): Promise<AuthTokens> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException('An account already exists with this e-mail');
    }
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        passwordHash: await bcrypt.hash(input.password, 12),
        language: input.language,
        credits: FREE_GENERATIONS_AT_SIGNUP,
      },
    });
    return this.issueTokens(user.id);
  }

  async loginWithEmail(input: EmailLoginInput): Promise<AuthTokens> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user?.passwordHash || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (user.suspendedAt) {
      throw new UnauthorizedException('Account suspended');
    }
    return this.issueTokens(user.id);
  }

  async refresh(refreshToken: string): Promise<AuthTokens> {
    const stored = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: this.hash(refreshToken) },
    });
    if (!stored || stored.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    // Rotation: a refresh token is single-use.
    await this.prisma.refreshToken.delete({ where: { id: stored.id } });
    return this.issueTokens(stored.userId);
  }

  private async issueTokens(userId: string): Promise<AuthTokens> {
    const expiresIn = Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900);
    const accessToken = await this.jwtService.signAsync({ sub: userId });
    const refreshToken = this.jwtService.sign(
      { sub: userId, kind: 'refresh' },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2_592_000),
      },
    );
    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash: this.hash(refreshToken),
        expiresAt: new Date(Date.now() + Number(process.env.JWT_REFRESH_TTL_SECONDS ?? 2_592_000) * 1000),
      },
    });
    return { accessToken, refreshToken, expiresIn };
  }

  private hash(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
