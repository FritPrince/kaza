import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { PaymentsService, MOBILE_MONEY_PROVIDERS } from './payments.service';
import { FedapayProvider } from './providers/fedapay.provider';
import { KkiapayProvider } from './providers/kkiapay.provider';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    FedapayProvider,
    KkiapayProvider,
    {
      // Both aggregators registered for redundancy (§12).
      provide: MOBILE_MONEY_PROVIDERS,
      useFactory: (fedapay: FedapayProvider, kkiapay: KkiapayProvider) => [fedapay, kkiapay],
      inject: [FedapayProvider, KkiapayProvider],
    },
  ],
})
export class PaymentsModule {}
