import { HttpException } from '@nestjs/common';
import type { RequestGenerationInput, StructuredPrompt } from '@kaza/shared';
import { GenerationsService } from './generations.service';

const structuredPrompt: StructuredPrompt = {
  style: 'modern',
  palette: ['beige'],
  budgetLevel: 'medium',
  keepElements: [],
  instructions: 'Cozy living room',
};

function buildService(overrides: { credits?: number } = {}) {
  const prisma = {
    room: {
      findUnique: jest.fn().mockResolvedValue({
        id: 'room-1',
        sourcePhotoKey: 'rooms/room-1/photo.jpg',
        project: { userId: 'user-1' },
      }),
    },
    user: {
      // Atomic conditional decrement: count=0 simulates "not enough credits".
      updateMany: jest.fn().mockResolvedValue({ count: overrides.credits === 0 ? 0 : 1 }),
    },
    generation: {
      aggregate: jest.fn().mockResolvedValue({ _max: { version: 2 } }),
      create: jest.fn(),
    },
    $transaction: jest
      .fn()
      .mockImplementation(() =>
        Promise.resolve([
          { id: 'gen-1', version: 3 },
          { id: 'gen-2', version: 4 },
        ]),
      ),
  };
  const queue = { addBulk: jest.fn().mockResolvedValue([]) };
  const service = new GenerationsService(
    prisma as never,
    {} as never, // interview agent unused here
    {} as never, // storage unused here
    queue as never,
  );
  return { service, prisma, queue };
}

describe('GenerationsService.requestGeneration', () => {
  const input: RequestGenerationInput = {
    roomId: 'room-1',
    structuredPrompt,
    variants: 2,
  };

  it('decrements credits atomically before enqueueing', async () => {
    const { service, prisma, queue } = buildService();

    await service.requestGeneration('user-1', input);

    expect(prisma.user.updateMany).toHaveBeenCalledWith({
      where: { id: 'user-1', credits: { gte: 2 }, suspendedAt: null },
      data: { credits: { decrement: 2 } },
    });
    expect(queue.addBulk).toHaveBeenCalledTimes(1);
    const jobs = queue.addBulk.mock.calls[0]![0];
    expect(jobs).toHaveLength(2);
    expect(jobs[0].opts.attempts).toBe(3);
  });

  it('throws 402 without enqueueing when credits are insufficient', async () => {
    const { service, queue } = buildService({ credits: 0 });

    await expect(service.requestGeneration('user-1', input)).rejects.toMatchObject({
      status: 402,
    });
    expect(queue.addBulk).not.toHaveBeenCalled();
  });

  it('rejects a room owned by another user', async () => {
    const { service, prisma } = buildService();
    prisma.room.findUnique.mockResolvedValue({
      id: 'room-1',
      sourcePhotoKey: 'rooms/room-1/photo.jpg',
      project: { userId: 'someone-else' },
    });

    await expect(service.requestGeneration('user-1', input)).rejects.toBeInstanceOf(HttpException);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });

  it('rejects a room without a source photo', async () => {
    const { service, prisma } = buildService();
    prisma.room.findUnique.mockResolvedValue({
      id: 'room-1',
      sourcePhotoKey: null,
      project: { userId: 'user-1' },
    });

    await expect(service.requestGeneration('user-1', input)).rejects.toBeInstanceOf(HttpException);
    expect(prisma.user.updateMany).not.toHaveBeenCalled();
  });
});
