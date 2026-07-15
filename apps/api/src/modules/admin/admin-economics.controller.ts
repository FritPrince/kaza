import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminAuthGuard, RequireRoles } from './guards/admin-auth.guard';
import { AdminEconomicsService } from './admin-economics.service';

const periodQuerySchema = z.object({ period: z.enum(['7d', '30d', '90d']).default('30d') });
type PeriodQuery = z.infer<typeof periodQuerySchema>;

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@RequireRoles('finance')
@Controller('admin/economics')
export class AdminEconomicsController {
  constructor(private readonly economicsService: AdminEconomicsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Revenue, AI costs and gross margin (G2)' })
  dashboard(@Query(new ZodValidationPipe(periodQuerySchema)) query: PeriodQuery) {
    return this.economicsService.getDashboard(query.period);
  }
}
