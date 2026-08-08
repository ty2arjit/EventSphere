import { describe, expect, it } from 'vitest';
import { AuthenticationSession } from './AuthenticationSession';
import { SessionExpiredError, SessionRevokedError } from '../errors';

function build(overrides: Partial<Parameters<typeof AuthenticationSession.create>[0]> = {}) {
  const now = new Date('2026-01-01T00:00:00Z');
  return AuthenticationSession.create({
    id: 'session-1',
    userCredentialId: 'user-1',
    refreshTokenHash: 'hash',
    deviceLabel: null,
    ipAddress: null,
    createdAt: now,
    expiresAt: new Date('2026-02-01T00:00:00Z'),
    revokedAt: null,
    ...overrides,
  });
}

describe('AuthenticationSession', () => {
  it('is active before expiry and unrevoked', () => {
    expect(build().isActive(new Date('2026-01-15T00:00:00Z'))).toBe(true);
  });

  it('is not active after expiry', () => {
    expect(build().isActive(new Date('2026-03-01T00:00:00Z'))).toBe(false);
  });

  it('revoke() sets revokedAt', () => {
    const s = build();
    s.revoke(new Date('2026-01-10T00:00:00Z'));
    expect(s.revokedAt).toEqual(new Date('2026-01-10T00:00:00Z'));
  });

  it('revoke() is idempotent', () => {
    const s = build();
    s.revoke(new Date('2026-01-10T00:00:00Z'));
    s.revoke(new Date('2026-01-20T00:00:00Z'));
    expect(s.revokedAt).toEqual(new Date('2026-01-10T00:00:00Z'));
  });

  it('assertActive throws SessionRevokedError for revoked sessions', () => {
    const s = build();
    s.revoke();
    expect(() => s.assertActive()).toThrow(SessionRevokedError);
  });

  it('assertActive throws SessionExpiredError past expiry', () => {
    const s = build();
    expect(() => s.assertActive(new Date('2026-03-01T00:00:00Z'))).toThrow(SessionExpiredError);
  });

  it('assertActive is a no-op for active sessions', () => {
    expect(() => build().assertActive(new Date('2026-01-15T00:00:00Z'))).not.toThrow();
  });
});
