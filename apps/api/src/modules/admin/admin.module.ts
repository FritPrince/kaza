import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminUsersController } from './admin-users.controller';
import { AdminUsersService } from './admin-users.service';
import { AdminEconomicsController } from './admin-economics.controller';
import { AdminEconomicsService } from './admin-economics.service';
import { AuditService } from './audit.service';
import { AdminAuthGuard } from './guards/admin-auth.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET,
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [AdminAuthController, AdminUsersController, AdminEconomicsController],
  providers: [AdminAuthService, AdminUsersService, AdminEconomicsService, AuditService, AdminAuthGuard],
})
export class AdminModule {}
