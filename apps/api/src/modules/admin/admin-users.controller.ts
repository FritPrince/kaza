import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  adjustCreditsSchema,
  paginationQuerySchema,
  suspendUserSchema,
  type AdjustCreditsInput,
  type SuspendUserInput,
} from '@kaza/shared';
import { z } from 'zod';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { AdminAuthGuard, RequireRoles, type AdminRequest } from './guards/admin-auth.guard';
import { AdminUsersService } from './admin-users.service';

const searchQuerySchema = paginationQuerySchema.extend({
  q: z.string().max(100).optional(),
});
type SearchQuery = z.infer<typeof searchQuerySchema>;

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(AdminAuthGuard)
@RequireRoles('support')
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Search users by e-mail, phone or name (G1)' })
  search(@Query(new ZodValidationPipe(searchQuerySchema)) query: SearchQuery) {
    return this.adminUsersService.search(query.q, query.page, query.pageSize);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Account detail with projects and transactions (G1)' })
  get(@Param('userId') userId: string) {
    return this.adminUsersService.getDetail(userId);
  }

  @Post('credits')
  @ApiOperation({ summary: 'Manual credit adjustment — audited (G1)' })
  adjustCredits(
    @Req() request: AdminRequest,
    @Body(new ZodValidationPipe(adjustCreditsSchema)) input: AdjustCreditsInput,
  ) {
    return this.adminUsersService.adjustCredits(request.adminId, input);
  }

  @Post('suspend')
  @ApiOperation({ summary: 'Suspend an account — audited (G1)' })
  suspend(
    @Req() request: AdminRequest,
    @Body(new ZodValidationPipe(suspendUserSchema)) input: SuspendUserInput,
  ) {
    return this.adminUsersService.suspend(request.adminId, input);
  }

  @Delete(':userId')
  @RequireRoles('super-admin')
  @ApiOperation({ summary: 'GDPR deletion of an account and all its data (G1)' })
  remove(@Req() request: AdminRequest, @Param('userId') userId: string) {
    return this.adminUsersService.gdprDelete(request.adminId, userId);
  }
}
