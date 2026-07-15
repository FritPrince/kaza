import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { adminLoginSchema, type AdminLoginInput } from '@kaza/shared';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminAuthGuard, type AdminRequest } from './guards/admin-auth.guard';
import { AdminAuthService } from './admin-auth.service';

const totpCodeSchema = z.object({ totpCode: z.string().length(6).regex(/^\d+$/) });
type TotpCodeInput = z.infer<typeof totpCodeSchema>;

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

  @Post('2fa/setup')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Generate the TOTP secret and otpauth URL (G8)' })
  setupTwoFactor(@Req() request: AdminRequest) {
    return this.adminAuthService.setupTwoFactor(request.adminId);
  }

  @Post('2fa/enable')
  @ApiBearerAuth()
  @UseGuards(AdminAuthGuard)
  @ApiOperation({ summary: 'Confirm a TOTP code and enforce 2FA on the account' })
  enableTwoFactor(
    @Req() request: AdminRequest,
    @Body(new ZodValidationPipe(totpCodeSchema)) input: TotpCodeInput,
  ) {
    return this.adminAuthService.enableTwoFactor(request.adminId, input.totpCode);
  }
}
