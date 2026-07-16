import { Injectable, Logger } from '@nestjs/common';
import type {
  CheckoutSession,
  MobileMoneyProvider,
  ProviderTransactionStatus,
} from './mobile-money-provider.interface';

const STATUS_MAP: Record<string, ProviderTransactionStatus> = {
  pending: 'pending',
  approved: 'approved',
  declined: 'declined',
  canceled: 'canceled',
  refunded: 'canceled',
  transferred: 'approved',
};

/**
 * FedaPay hosted checkout (§F2). Sandbox and live share the same API shape;
 * the base URL switches with FEDAPAY_ENV.
 */
@Injectable()
export class FedapayProvider implements MobileMoneyProvider {
  readonly name = 'fedapay' as const;
  private readonly logger = new Logger(FedapayProvider.name);

  private get baseUrl(): string {
    return process.env.FEDAPAY_ENV === 'live'
      ? 'https://api.fedapay.com/v1'
      : 'https://sandbox-api.fedapay.com/v1';
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  async createCheckout(params: {
    transactionId: string;
    amountXof: number;
    description: string;
    phone: string;
    callbackUrl: string;
  }): Promise<CheckoutSession> {
    if (!process.env.FEDAPAY_SECRET_KEY) {
      throw new Error('FEDAPAY_SECRET_KEY is not configured');
    }

    const createResponse = await fetch(`${this.baseUrl}/transactions`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({
        description: params.description,
        amount: params.amountXof,
        currency: { iso: 'XOF' },
        callback_url: params.callbackUrl,
        custom_metadata: { kazaTransactionId: params.transactionId },
        customer: { phone_number: { number: params.phone, country: 'bj' } },
      }),
    });
    if (!createResponse.ok) {
      throw new Error(`FedaPay create failed (${createResponse.status})`);
    }
    const created = (await createResponse.json()) as { 'v1/transaction': { id: number } };
    const providerRef = String(created['v1/transaction'].id);

    const tokenResponse = await fetch(`${this.baseUrl}/transactions/${providerRef}/token`, {
      method: 'POST',
      headers: this.headers,
    });
    if (!tokenResponse.ok) {
      throw new Error(`FedaPay token failed (${tokenResponse.status})`);
    }
    const token = (await tokenResponse.json()) as { url: string };

    this.logger.log(`FedaPay checkout created for tx ${params.transactionId} (ref ${providerRef})`);
    return { providerRef, checkoutUrl: token.url };
  }

  async verifyTransaction(providerRef: string): Promise<ProviderTransactionStatus> {
    const response = await fetch(`${this.baseUrl}/transactions/${providerRef}`, {
      headers: this.headers,
    });
    if (!response.ok) {
      throw new Error(`FedaPay verify failed (${response.status})`);
    }
    const payload = (await response.json()) as { 'v1/transaction': { status: string } };
    return STATUS_MAP[payload['v1/transaction'].status] ?? 'pending';
  }
}
