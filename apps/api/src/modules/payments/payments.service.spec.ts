import { BadRequestException } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import type {
  MobileMoneyProvider,
  ProviderTransactionStatus,
} from './providers/mobile-money-provider.interface';

function buildService(options: {
  pendingTransaction?: object | null;
  verifiedStatus?: ProviderTransactionStatus;
}) {
  const prisma = {
    appSetting: { findUnique: jest.fn().mockResolvedValue(null) },
    transaction: {
      create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
      findFirst: jest.fn().mockResolvedValue(options.pendingTransaction ?? null),
      update: jest.fn().mockResolvedValue({}),
      updateMany: jest.fn().mockResolvedValue({ count: 1 }),
    },
    user: { update: jest.fn().mockResolvedValue({}) },
  };
  const fedapay: MobileMoneyProvider = {
    name: 'fedapay',
    createCheckout: jest
      .fn()
      .mockResolvedValue({ providerRef: 'fp-123', checkoutUrl: 'https://pay.example/fp-123' }),
    verifyTransaction: jest.fn().mockResolvedValue(options.verifiedStatus ?? 'approved'),
  };
  const service = new PaymentsService(prisma as never, [fedapay]);
  return { service, prisma, fedapay };
}

describe('PaymentsService.initiateMobileMoneyPayment', () => {
  it('creates a pending transaction and returns the hosted checkout URL', async () => {
    const { service, prisma, fedapay } = buildService({});

    const result = await service.initiateMobileMoneyPayment('user-1', {
      packId: 'pack-10',
      provider: 'fedapay',
      phone: '+22990000000',
    });

    expect(result.checkoutUrl).toBe('https://pay.example/fp-123');
    expect(fedapay.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ transactionId: 'tx-1', amountXof: 2000 }),
    );
    expect(prisma.transaction.update).toHaveBeenCalledWith({
      where: { id: 'tx-1' },
      data: { providerRef: 'fp-123' },
    });
  });

  it('rejects an unknown pack', async () => {
    const { service } = buildService({});

    await expect(
      service.initiateMobileMoneyPayment('user-1', {
        packId: 'nope',
        provider: 'fedapay',
        phone: '+22990000000',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('PaymentsService.handleWebhook', () => {
  const pendingTx = { id: 'tx-1', userId: 'user-1', creditsGranted: 10, status: 'pending' };

  it('grants credits only after server-side verification approves', async () => {
    const { service, prisma, fedapay } = buildService({
      pendingTransaction: pendingTx,
      verifiedStatus: 'approved',
    });

    await service.handleWebhook('fedapay', { entity: { id: 'fp-123' } });

    expect(fedapay.verifyTransaction).toHaveBeenCalledWith('fp-123');
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { credits: { increment: 10 } },
    });
  });

  it('never credits when the provider says declined — even if the webhook claims success', async () => {
    const { service, prisma } = buildService({
      pendingTransaction: pendingTx,
      verifiedStatus: 'declined',
    });

    // Forged webhook body claiming approval — verification is the only truth.
    await service.handleWebhook('fedapay', { entity: { id: 'fp-123' }, status: 'approved' });

    expect(prisma.user.update).not.toHaveBeenCalled();
    expect(prisma.transaction.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'failed' } }),
    );
  });

  it('is idempotent: a replayed webhook on a completed transaction does nothing', async () => {
    const { service, prisma, fedapay } = buildService({ pendingTransaction: null });

    await service.handleWebhook('fedapay', { entity: { id: 'fp-123' } });

    expect(fedapay.verifyTransaction).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('does not double-credit under concurrent webhooks (conditional update loses the race)', async () => {
    const { service, prisma } = buildService({
      pendingTransaction: pendingTx,
      verifiedStatus: 'approved',
    });
    prisma.transaction.updateMany.mockResolvedValue({ count: 0 }); // another webhook won

    await service.handleWebhook('fedapay', { entity: { id: 'fp-123' } });

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects an unknown provider', async () => {
    const { service } = buildService({});

    await expect(service.handleWebhook('paypal', {})).rejects.toBeInstanceOf(BadRequestException);
  });
});
