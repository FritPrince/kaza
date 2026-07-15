import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
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

  private verifyTotp(_secret: string, _code: string): void {
    // TODO(G8): verify TOTP with otplib once 2FA enrolment is built.
    throw new UnauthorizedException('TOTP verification not available yet');
  }
}
