import { PaymentsService } from './payments.service';

function buildService(pendingTransaction: object | null) {
  const prisma = {
    appSetting: { findUnique: jest.fn().mockResolvedValue(null) },
    transaction: {
      create: jest.fn(),
      findFirst: jest.fn().mockResolvedValue(pendingTransaction),
      update: jest.fn().mockResolvedValue({}),
    },
    user: { update: jest.fn().mockResolvedValue({}) },
    $transaction: jest.fn().mockImplementation((ops: unknown[]) => Promise.all(ops as never)),
  };
  return { service: new PaymentsService(prisma as never), prisma };
}

describe('PaymentsService.handleWebhook', () => {
  const originalEnv = process.env.NODE_ENV;
  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('grants credits exactly once for a pending transaction', async () => {
    const { service, prisma } = buildService({
      id: 'tx-1',
      userId: 'user-1',
      creditsGranted: 10,
      status: 'pending',
    });

    await service.handleWebhook('fedapay', undefined, { reference: 'tx-1', status: 'approved' });

    expect(prisma.transaction.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: 'completed' }) }),
    );
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-1' },
      data: { credits: { increment: 10 } },
    });
  });

  it('is idempotent: a replayed webhook does not grant credits twice', async () => {
    // findFirst filters on status=pending — a completed transaction returns null.
    const { service, prisma } = buildService(null);

    await service.handleWebhook('fedapay', undefined, { reference: 'tx-1', status: 'approved' });

    expect(prisma.transaction.update).not.toHaveBeenCalled();
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('ignores non-success statuses', async () => {
    const { service, prisma } = buildService({ id: 'tx-1', userId: 'user-1', creditsGranted: 10 });

    await service.handleWebhook('fedapay', undefined, { reference: 'tx-1', status: 'declined' });

    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it('rejects an unsigned webhook in production when a secret is configured', async () => {
    process.env.NODE_ENV = 'production';
    process.env.FEDAPAY_SECRET_KEY = 'secret';
    const { service } = buildService(null);

    await expect(
      service.handleWebhook('fedapay', undefined, { reference: 'tx-1', status: 'approved' }),
    ).rejects.toMatchObject({ status: 401 });
    delete process.env.FEDAPAY_SECRET_KEY;
  });
});
