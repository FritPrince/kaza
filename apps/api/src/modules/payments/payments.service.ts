import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import type { InitiateMobileMoneyPaymentInput } from '@kaza/shared';
import { PrismaService } from '../../prisma/prisma.service';

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

  constructor(private readonly prisma: PrismaService) {}

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

    // TODO(F2): create the checkout on FedaPay/KkiaPay and return its payment URL.
    // Both aggregators are integrated for redundancy (§12).
    return {
      transactionId: transaction.id,
      provider: input.provider,
      checkoutUrl: null,
      status: 'pending',
    };
  }

  async handleWebhook(provider: string, signature: string | undefined, payload: unknown) {
    this.verifySignature(provider, signature, payload);

    // TODO(F2): parse the provider-specific payload. Expected shape below.
    const event = payload as { reference?: string; status?: string };
    if (!event.reference) {
      throw new BadRequestException('Missing transaction reference');
    }

    if (event.status === 'approved' || event.status === 'success') {
      await this.completeTransaction(event.reference);
    }
    return { received: true };
  }

  /** Idempotent: a webhook replay must not grant credits twice. */
  private async completeTransaction(providerRef: string): Promise<void> {
    const transaction = await this.prisma.transaction.findFirst({
      where: { OR: [{ id: providerRef }, { providerRef }], status: 'pending' },
    });
    if (!transaction) {
      this.logger.warn(`Webhook for unknown or already completed transaction ${providerRef}`);
      return;
    }
    await this.prisma.$transaction([
      this.prisma.transaction.update({
        where: { id: transaction.id },
        data: { status: 'completed', providerRef },
      }),
      this.prisma.user.update({
        where: { id: transaction.userId },
        data: { credits: { increment: transaction.creditsGranted ?? 0 } },
      }),
    ]);
  }

  private verifySignature(provider: string, signature: string | undefined, _payload: unknown): void {
    const secret =
      provider === 'fedapay' ? process.env.FEDAPAY_SECRET_KEY : process.env.KKIAPAY_SECRET_KEY;
    if (!secret) {
      this.logger.warn(`No webhook secret configured for ${provider} — accepting in dev only`);
      if (process.env.NODE_ENV === 'production') {
        throw new UnauthorizedException('Webhook secret not configured');
      }
      return;
    }
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }
    // TODO(F2): verify HMAC per provider documentation.
  }
}
