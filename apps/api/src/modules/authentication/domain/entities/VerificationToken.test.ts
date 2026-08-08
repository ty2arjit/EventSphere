import { describe, expect, it } from 'vitest';
import { VerificationToken } from './VerificationToken';
import {
  VerificationTokenAlreadyConsumedError,
  VerificationTokenExpiredError,
} from '../errors';

function build(overrides: Partial<Parameters<typeof VerificationToken.create>[0]> = {}) {
  return VerificationToken.create({
    id: 'token-1',
    userCredentialId: 'user-1',
    purpose: 'email_verification',
    tokenHash: 'hash',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    expiresAt: new Date('2026-01-02T00:00:00Z'),
    consumedAt: null,
    ...overrides,
  });
}

describe('VerificationToken.consume', () => {
  it('marks the token as consumed on first use', () => {
    const t = build();
    t.consume(new Date('2026-01-01T12:00:00Z'));
    expect(t.consumedAt).toEqual(new Date('2026-01-01T12:00:00Z'));
  });

  it('rejects reuse', () => {
    const t = build();
    t.consume(new Date('2026-01-01T12:00:00Z'));
    expect(() => t.consume()).toThrow(VerificationTokenAlreadyConsumedError);
  });

  it('rejects consumption past expiry', () => {
    const t = build();
    expect(() => t.consume(new Date('2026-02-01T00:00:00Z'))).toThrow(VerificationTokenExpiredError);
  });
});
