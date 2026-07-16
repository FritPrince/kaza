import { BadRequestException, Inject, Injectable, Logger } from '@nestjs/common';
import type { InitiateMobileMoneyPaymentInput } from '@kaza/shared';
import { PrismaService } from '../../prisma/prisma.service';
import {
  type MobileMoneyProvider,
  type ProviderTransactionStatus,
} from './providers/mobile-money-provider.interface';

export const MOBILE_MONEY_PROVIDERS = Symbol('MOBILE_MONEY_PROVIDERS');

interface CreditPack {
  id: string;
  credits: number;
  priceXof: number;
}

/** Fallback packs used until the admin configures them in app_settings (§G6). */
const DEFAULT_PACKS: CreditPack[] = [
  { id: 'pack-10', credits: 10, priceXof: 2000 },
  { id: 'pack-30', credits: 30, priceXof: 5000 },
  { id: 'pack-100', credits: 100, priceXof: 15000 },
];

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(MOBILE_MONEY_PROVIDERS) private readonly providers: MobileMoneyProvider[],
  ) {}

  async listPacks(): Promise<CreditPack[]> {
    const setting = await this.prisma.appSetting.findUnique({ where: { key: 'credit-packs' } });
    return (setting?.value as CreditPack[] | undefined) ?? DEFAULT_PACKS;
  }

  async initiateMobileMoneyPayment(userId: string, input: InitiateMobileMoneyPaymentInput) {
    const packs = await this.listPacks();
    const pack = packs.find((p) => p.id === input.packId);
    if (!pack) {
      throw new BadRequestException('Unknown credit pack');
    }
    const provider = this.getProvider(input.provider);

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        type: 'credits',
        amount: pack.priceXof,
        currency: 'XOF',
        channel: 'mobile_money',
        creditsGranted: pack.credits,
      },
    });

    const session = await provider.createCheckout({
      transactionId: transaction.id,
      amountXof: pack.priceXof,
      description: `Kaza — pack ${pack.credits} crédits`,
      phone: input.phone,
      callbackUrl: `${process.env.API_BASE_URL}/v1/payments/webhooks/${provider.name}`,
    });

    await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: { providerRef: session.providerRef },
    });

    return {
      transactionId: transaction.id,
      provider: provider.name,
      checkoutUrl: session.checkoutUrl,
      status: 'pending',
    };
  }

  /**
   * Webhook entry point. The payload is only used to find OUR transaction —
   * the decision to grant credits always comes from a server-to-server status
   * check with the provider. A forged webhook can therefore never credit.
   */
  async handleWebhook(providerName: string, payload: unknown) {
    const provider = this.getProvider(providerName);
    const providerRef = this.extractReference(providerName, payload);
    if (!providerRef) {
      throw new BadRequestException('Missing transaction reference');
    }

    const transaction = await this.prisma.transaction.findFirst({
      where: { providerRef, status: 'pending' },
    });
    if (!transaction) {
      // Unknown ref or already processed — idempotent no-op.
      this.logger.warn(`Webhook for unknown or already completed transaction ${providerRef}`);
      return { received: true };
    }

    const status = await provider.verifyTransaction(providerRef);
    await this.applyVerifiedStatus(transaction.id, transaction.userId, transaction.creditsGranted, status);
    return { received: true };
  }

  private async applyVerifiedStatus(
    transactionId: string,
    userId: string,
    creditsGranted: number | null,
    status: ProviderTransactionStatus,
  ): Promise<void> {
    if (status === 'approved') {
      // Conditional update keeps this idempotent even under concurrent webhooks.
      const updated = await this.prisma.transaction.updateMany({
        where: { id: transactionId, status: 'pending' },
        data: { status: 'completed' },
      });
      if (updated.count === 1) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { credits: { increment: creditsGranted ?? 0 } },
        });
        this.logger.log(`Transaction ${transactionId} completed — ${creditsGranted} credits granted`);
      }
    } else if (status === 'declined' || status === 'canceled') {
      await this.prisma.transaction.updateMany({
        where: { id: transactionId, status: 'pending' },
        data: { status: 'failed' },
      });
    }
    // 'pending': leave as is — a later webhook or reconciliation job will settle it.
  }

  private extractReference(providerName: string, payload: unknown): string | null {
    const body = payload as Record<string, unknown>;
    if (providerName === 'fedapay') {
      // FedaPay events wrap the transaction in `entity`.
      const entity = body?.entity as { id?: number | string } | undefined;
      return entity?.id != null ? String(entity.id) : null;
    }
    // KkiaPay echoes our own transaction id passed to the widget.
    const ref = body?.transactionId ?? body?.stateData;
    return ref != null ? String(ref) : null;
  }

  private getProvider(name: string): MobileMoneyProvider {
    const provider = this.providers.find((p) => p.name === name);
    if (!provider) {
      throw new BadRequestException(`Unknown payment provider: ${name}`);
    }
    return provider;
  }
}
