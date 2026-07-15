import { UnauthorizedException } from '@nestjs/common';
import { createHash } from 'node:crypto';
import { AuthService } from './auth.service';

const hash = (value: string) => createHash('sha256').update(value).digest('hex');

function buildService(otpRow: object | null) {
  const prisma = {
    otpCode: {
      create: jest.fn().mockResolvedValue({}),
      findFirst: jest.fn().mockResolvedValue(otpRow),
      update: jest.fn().mockResolvedValue({}),
      delete: jest.fn().mockResolvedValue({}),
    },
    user: {
      upsert: jest.fn().mockResolvedValue({ id: 'user-1' }),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn().mockResolvedValue({}),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
  };
  const jwtService = {
    signAsync: jest.fn().mockResolvedValue('access-token'),
    sign: jest.fn().mockReturnValue('refresh-token'),
  };
  const sms = { sendOtp: jest.fn().mockResolvedValue(undefined) };
  const service = new AuthService(prisma as never, jwtService as never, sms as never);
  return { service, prisma, sms };
}

describe('AuthService OTP flow', () => {
  it('sends a 6-digit code and stores only its hash', async () => {
    const { service, prisma, sms } = buildService(null);

    await service.requestOtp('+22990000000');

    expect(sms.sendOtp).toHaveBeenCalledTimes(1);
    const [, sentCode] = sms.sendOtp.mock.calls[0]!;
    expect(sentCode).toMatch(/^\d{6}$/);
    const stored = prisma.otpCode.create.mock.calls[0]![0].data;
    expect(stored.codeHash).toBe(hash(sentCode));
    expect(stored.codeHash).not.toBe(sentCode);
  });

  it('rejects when no valid (non-expired) code exists', async () => {
    const { service } = buildService(null);

    await expect(service.verifyOtp('+22990000000', '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('rejects after too many attempts', async () => {
    const { service } = buildService({
      id: 'otp-1',
      codeHash: hash('123456'),
      attempts: 5,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.verifyOtp('+22990000000', '123456')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('increments attempts on a wrong code', async () => {
    const { service, prisma } = buildService({
      id: 'otp-1',
      codeHash: hash('123456'),
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });

    await expect(service.verifyOtp('+22990000000', '999999')).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
    expect(prisma.otpCode.update).toHaveBeenCalledWith({
      where: { id: 'otp-1' },
      data: { attempts: { increment: 1 } },
    });
  });

  it('signs the user in, deletes the code and issues tokens on success', async () => {
    const { service, prisma } = buildService({
      id: 'otp-1',
      codeHash: hash('123456'),
      attempts: 0,
      expiresAt: new Date(Date.now() + 60_000),
    });

    const tokens = await service.verifyOtp('+22990000000', '123456');

    expect(prisma.otpCode.delete).toHaveBeenCalledWith({ where: { id: 'otp-1' } });
    expect(prisma.user.upsert).toHaveBeenCalled();
    expect(tokens.accessToken).toBe('access-token');
    expect(tokens.refreshToken).toBe('refresh-token');
    // Refresh token is stored hashed — never in clear (security).
    const storedRefresh = prisma.refreshToken.create.mock.calls[0]![0].data;
    expect(storedRefresh.tokenHash).toBe(hash('refresh-token'));
  });
});
