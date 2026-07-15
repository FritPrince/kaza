import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TermiiSmsProvider } from './sms/termii-sms.provider';
import { SMS_PROVIDER } from './sms/sms-provider.interface';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: Number(process.env.JWT_ACCESS_TTL_SECONDS ?? 900) },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtAuthGuard, { provide: SMS_PROVIDER, useClass: TermiiSmsProvider }],
  exports: [AuthService, JwtAuthGuard, JwtModule],
})
export class AuthModule {}
