import { Injectable, Logger } from '@nestjs/common';
import type {
  CheckoutSession,
  MobileMoneyProvider,
  ProviderTransactionStatus,
} from './mobile-money-provider.interface';

const STATUS_MAP: Record<string, ProviderTransactionStatus> = {
  SUCCESS: 'approved',
  FAILED: 'declined',
  PENDING: 'pending',
};

/**
 * KkiaPay (§F2) — redundancy provider. KkiaPay uses a JS widget rather than a
 * hosted checkout API, so createCheckout points to our own web checkout page
 * (KKIAPAY_CHECKOUT_URL) which embeds the widget with the public key; status
 * verification is a server-to-server call with the private key.
 */
@Injectable()
export class KkiapayProvider implements MobileMoneyProvider {
  readonly name = 'kkiapay' as const;
  private readonly logger = new Logger(KkiapayProvider.name);

  async createCheckout(params: {
    transactionId: string;
    amountXof: number;
    description: string;
    phone: string;
    callbackUrl: string;
  }): Promise<CheckoutSession> {
    const checkoutBase = process.env.KKIAPAY_CHECKOUT_URL;
    if (!checkoutBase) {
      throw new Error('KKIAPAY_CHECKOUT_URL is not configured (widget page not deployed yet)');
    }
    // Our own transaction id is the reference: the widget page passes it back
    // in the payment data, and the webhook echoes it for verification.
    const url = new URL(checkoutBase);
    url.searchParams.set('txId', params.transactionId);
    url.searchParams.set('amount', String(params.amountXof));
    url.searchParams.set('phone', params.phone);
    this.logger.log(`KkiaPay checkout URL built for tx ${params.transactionId}`);
    return { providerRef: params.transactionId, checkoutUrl: url.toString() };
  }

  async verifyTransaction(providerRef: string): Promise<ProviderTransactionStatus> {
    if (!process.env.KKIAPAY_PRIVATE_KEY) {
      throw new Error('KKIAPAY_PRIVATE_KEY is not configured');
    }
    const response = await fetch('https://api.kkiapay.me/api/v1/transactions/status', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-private-key': process.env.KKIAPAY_PRIVATE_KEY,
        'x-api-key': process.env.KKIAPAY_PUBLIC_KEY ?? '',
        'x-secret-key': process.env.KKIAPAY_SECRET_KEY ?? '',
      },
      body: JSON.stringify({ transactionId: providerRef }),
    });
    if (!response.ok) {
      throw new Error(`KkiaPay verify failed (${response.status})`);
    }
    const payload = (await response.json()) as { status?: string };
    return STATUS_MAP[payload.status ?? ''] ?? 'pending';
  }
}
