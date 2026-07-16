import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  initiateMobileMoneyPaymentSchema,
  type InitiateMobileMoneyPaymentInput,
} from '@kaza/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentUserId } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('packs')
  @ApiOperation({ summary: 'Available credit packs — prices managed in app_settings (§G6)' })
  listPacks() {
    return this.paymentsService.listPacks();
  }

  @Post('mobile-money/initiate')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Start a Mobile Money checkout — FedaPay or KkiaPay (§F2)' })
  initiateMobileMoney(
    @CurrentUserId() userId: string,
    @Body(new ZodValidationPipe(initiateMobileMoneyPaymentSchema))
    input: InitiateMobileMoneyPaymentInput,
  ) {
    return this.paymentsService.initiateMobileMoneyPayment(userId, input);
  }

  @Post('webhooks/:provider')
  @HttpCode(200)
  @ApiOperation({
    summary:
      'Payment provider webhook — credits are granted only after a server-to-server status check',
  })
  webhook(@Param('provider') provider: string, @Body() payload: unknown) {
    return this.paymentsService.handleWebhook(provider, payload);
  }
}
