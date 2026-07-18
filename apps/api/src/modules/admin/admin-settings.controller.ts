import { Body, Controller, Get, Param, Put, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminAuthGuard, RequireRoles, type AdminRequest } from './guards/admin-auth.guard';
import { AdminSettingsService } from './admin-settings.service';

const updateSettingSchema = z.object({
  // Arbitrary JSON — each key has its own shape (credit packs, quiz images, flags…).
  value: z.unknown(),
});
type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@RequireRoles('super-admin')
@Controller('admin/settings')
export class AdminSettingsController {
  constructor(private readonly settingsService: AdminSettingsService) {}

  @Get()
  @ApiOperation({ summary: 'All product settings: packs, quiz images, feature flags (G6)' })
  list() {
    return this.settingsService.list();
  }

  @Put(':key')
  @ApiOperation({ summary: 'Create or update a setting without redeploying — audited' })
  upsert(
    @Req() request: AdminRequest,
    @Param('key') key: string,
    @Body(new ZodValidationPipe(updateSettingSchema)) input: UpdateSettingInput,
  ) {
    return this.settingsService.upsert(request.adminId, key, input.value);
  }
}
