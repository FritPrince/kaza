export interface CheckoutSession {
  /** Provider-side transaction reference, stored on our transaction row. */
  providerRef: string;
  /** Hosted payment page the mobile app opens in a browser. */
  checkoutUrl: string;
}

export type ProviderTransactionStatus = 'pending' | 'approved' | 'declined' | 'canceled';

/**
 * Abstraction over Mobile Money aggregators (§F2). Two implementations are
 * kept for redundancy (§12): FedaPay and KkiaPay.
 */
export interface MobileMoneyProvider {
  readonly name: 'fedapay' | 'kkiapay';

  createCheckout(params: {
    transactionId: string;
    amountXof: number;
    description: string;
    phone: string;
    callbackUrl: string;
  }): Promise<CheckoutSession>;

  /**
   * Server-to-server status check — the source of truth when a webhook
   * arrives. Never trust the webhook payload alone.
   */
  verifyTransaction(providerRef: string): Promise<ProviderTransactionStatus>;
}
