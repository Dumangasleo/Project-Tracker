import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import type { Repository } from 'typeorm';
import type { RefreshToken } from '../entities/refresh-token.entity';
import { TokenService } from './token.service';

const context = { ipAddress: '127.0.0.1', userAgent: 'jest' };
const member = { id: 7, email: 'juan@example.com' };

function setup(record: Partial<RefreshToken> | null, revokeAffects: number) {
  const repository = {
    findOne: jest.fn().mockResolvedValue(record),
    update: jest
      .fn()
      .mockImplementation((criteria: { id?: number }) =>
        Promise.resolve({ affected: criteria.id ? revokeAffects : 1 }),
      ),
    delete: jest.fn().mockResolvedValue({ affected: 0 }),
    insert: jest.fn().mockResolvedValue({}),
  };
  const jwt = { signAsync: jest.fn().mockResolvedValue('access-token') };
  const config = {
    get: (key: string) =>
      ({ JWT_ACCESS_TTL_SECONDS: 900, REFRESH_TOKEN_TTL_DAYS: 7 })[key],
  };

  const service = new TokenService(
    jwt as unknown as JwtService,
    repository as unknown as Repository<RefreshToken>,
    config as unknown as ConfigService<never, true>,
  );
  return { service, repository };
}

const activeRecord = (overrides: Partial<RefreshToken> = {}) => ({
  id: 1,
  familyId: 'family-1',
  memberId: member.id,
  member: member as never,
  expiresAt: new Date(Date.now() + 60_000),
  revokedAt: null,
  ...overrides,
});

describe('TokenService.rotate', () => {
  it('revokes the presented token and issues a new pair in the same family', async () => {
    const { service, repository } = setup(activeRecord(), 1);

    const { tokens } = await service.rotate('presented', context);

    expect(tokens.accessToken).toBe('access-token');
    expect(tokens.refreshToken).not.toBe('presented');
    expect(repository.insert).toHaveBeenCalledWith(
      expect.objectContaining({ familyId: 'family-1', memberId: member.id }),
    );
  });

  it('rejects an unknown or expired token', async () => {
    await expect(setup(null, 1).service.rotate('x', context)).rejects.toThrow(
      UnauthorizedException,
    );
    const expired = activeRecord({ expiresAt: new Date(Date.now() - 1) });
    await expect(
      setup(expired, 1).service.rotate('x', context),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('treats reuse of an old token as theft and revokes the whole family', async () => {
    const reused = activeRecord({ revokedAt: new Date(Date.now() - 60_000) });
    const { service, repository } = setup(reused, 0);

    await expect(service.rotate('stolen', context)).rejects.toThrow(
      UnauthorizedException,
    );
    const updates = repository.update.mock.calls as [{ familyId?: string }][];
    expect(updates.some(([criteria]) => criteria.familyId === 'family-1')).toBe(
      true,
    );
    expect(repository.insert).not.toHaveBeenCalled();
  });

  it('allows a parallel refresh within the grace window', async () => {
    const justRotated = activeRecord({ revokedAt: new Date() });
    const { service, repository } = setup(justRotated, 0);

    await expect(service.rotate('presented', context)).resolves.toBeDefined();
    expect(repository.insert).toHaveBeenCalled();
  });
});

describe('TokenService.revoke', () => {
  it('expires the token so a logged-out token cannot use the grace window', async () => {
    const { service, repository } = setup(null, 1);

    await service.revoke('presented');

    const [[, values]] = repository.update.mock.calls as [
      unknown,
      { revokedAt?: Date; expiresAt?: Date },
    ][];
    expect(values.revokedAt).toBeInstanceOf(Date);
    expect(values.expiresAt).toBeInstanceOf(Date);
  });
});
