import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import type { AdminLoginInput } from '@kaza/shared';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(input: AdminLoginInput) {
    const admin = await this.prisma.adminUser.findUnique({ where: { email: input.email } });
    if (!admin || !(await bcrypt.compare(input.password, admin.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (admin.twoFactorEnabled) {
      if (!input.totpCode) {
        // The front shows the TOTP step when it receives this flag.
        return { requiresTotp: true };
      }
      this.verifyTotp(admin.twoFactorSecret ?? '', input.totpCode);
    }

    const accessToken = await this.jwtService.signAsync({
      sub: admin.id,
      role: admin.role.replace('_', '-'),
      scope: 'admin',
    });
    return {
      accessToken,
      admin: {
        id: admin.id,
        email: admin.email,
        displayName: admin.displayName,
        role: admin.role.replace('_', '-'),
      },
    };
  }

  /** Step 1 of enrolment: generate a secret and the otpauth:// URL for the authenticator app. */
  async setupTwoFactor(adminId: string) {
    const admin = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: adminId } });
    const secret = authenticator.generateSecret();
    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { twoFactorSecret: secret, twoFactorEnabled: false },
    });
    return {
      secret,
      otpauthUrl: authenticator.keyuri(admin.email, 'Kaza Back-office', secret),
    };
  }

  /** Step 2: confirm with a valid code — only then is 2FA actually enforced. */
  async enableTwoFactor(adminId: string, totpCode: string) {
    const admin = await this.prisma.adminUser.findUniqueOrThrow({ where: { id: adminId } });
    if (!admin.twoFactorSecret) {
      throw new BadRequestException('Run 2FA setup first');
    }
    this.verifyTotp(admin.twoFactorSecret, totpCode);
    await this.prisma.adminUser.update({
      where: { id: adminId },
      data: { twoFactorEnabled: true },
    });
    return { enabled: true };
  }

  private verifyTotp(secret: string, code: string): void {
    if (!authenticator.verify({ token: code, secret })) {
      throw new UnauthorizedException('Invalid 2FA code');
    }
  }
}
