import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { paginationQuerySchema } from '@kaza/shared';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminAuthGuard, RequireRoles, type AdminRequest } from './guards/admin-auth.guard';
import { AdminModerationService } from './admin-moderation.service';

const queueQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});
type QueueQuery = z.infer<typeof queueQuerySchema>;

const decisionSchema = z.object({
  decision: z.string().min(3).max(500),
});
type DecisionInput = z.infer<typeof decisionSchema>;

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@RequireRoles('moderator')
@Controller('admin/moderation')
export class AdminModerationController {
  constructor(private readonly moderationService: AdminModerationService) {}

  @Get()
  @ApiOperation({ summary: 'Moderation queue with signed image URLs (G4)' })
  list(@Query(new ZodValidationPipe(queueQuerySchema)) query: QueueQuery) {
    return this.moderationService.list(query.status, query.page, query.pageSize);
  }

  @Post(':itemId/approve')
  @ApiOperation({ summary: 'Approve a flagged image — audited' })
  approve(
    @Req() request: AdminRequest,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(decisionSchema)) input: DecisionInput,
  ) {
    return this.moderationService.decide(request.adminId, itemId, 'approved', input.decision);
  }

  @Post(':itemId/reject')
  @ApiOperation({ summary: 'Reject a flagged image — audited' })
  reject(
    @Req() request: AdminRequest,
    @Param('itemId') itemId: string,
    @Body(new ZodValidationPipe(decisionSchema)) input: DecisionInput,
  ) {
    return this.moderationService.decide(request.adminId, itemId, 'rejected', input.decision);
  }
}
