import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminEconomicsController } from './admin-economics.controller';
import { AdminEconomicsService } from './admin-economics.service';
import { AdminModerationController } from './admin-moderation.controller';
import { AdminModerationService } from './admin-moderation.service';
import { AdminSettingsController } from './admin-settings.controller';
import { AdminSettingsService } from './admin-settings.service';
import { AuditService } from './audit.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminUsersController,
    AdminEconomicsController,
    AdminModerationController,
    AdminSettingsController,
  ],
  providers: [
    AdminAuthService,
    AdminUsersService,
    AdminEconomicsService,
    AdminModerationService,
    AdminSettingsService,
    AuditService,
    AdminAuthGuard,
  ],
})
export class AdminModule {}
