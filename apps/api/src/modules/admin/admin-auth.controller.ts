import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { adminLoginSchema, type AdminLoginInput } from '@kaza/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminAuthService } from './admin-auth.service';

@ApiTags('admin')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Back-office login — 2FA required when enabled (§G8)' })
  login(@Body(new ZodValidationPipe(adminLoginSchema)) input: AdminLoginInput) {
    return this.adminAuthService.login(input);
  }
}
