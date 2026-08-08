import { describe, expect, it } from 'vitest';
import { UserCredential } from './UserCredential';
import { EmailAddress } from './valueObjects/EmailAddress';
import { HashedPassword } from './valueObjects/HashedPassword';
import { PlaintextPassword } from './valueObjects/PlaintextPassword';
import type { PasswordHasher } from './services/PasswordHasher';
import {
  EmailAlreadyVerifiedError,
  InvalidCredentialsError,
  SessionNotFoundError,
  VerificationTokenNotFoundError,
  VerificationTokenAlreadyConsumedError,
} from './errors';
import { CREDENTIAL_REGISTERED } from './events/CredentialRegistered';
import { EMAIL_VERIFIED } from './events/EmailVerified';
import { PASSWORD_CHANGED } from './events/PasswordChanged';
import { SESSION_STARTED } from './events/SessionStarted';
import { SESSION_REVOKED } from './events/SessionRevoked';

const email = EmailAddress.create('jane@example.com');
const password = HashedPassword.create('argon2id', 'stub-hash');

/**
 * A stub hasher that matches by string identity — good enough for aggregate
 * tests, which are about branching logic, not cryptography.
 */
const stubHasher: PasswordHasher = {
  hash: async (p) => HashedPassword.create('argon2id', `hashed(${p.reveal()})`),
  verify: async (p, h) => `hashed(${p.reveal()})` === h.hash,
};

async function registered() {
  const cred = UserCredential.register('user-1', email, HashedPassword.create('argon2id', 'hashed(pw)'));
  cred.pullDomainEvents(); // discard CredentialRegistered
  return cred;
}

describe('UserCredential.register', () => {
  it('creates a credential with a password provider', () => {
    const cred = UserCredential.register('user-1', email, password);
    expect(cred.id).toBe('user-1');
    expect(cred.email).toBe('jane@example.com');
    expect(cred.hasPassword).toBe(true);
    expect(cred.hasProvider('password')).toBe(true);
    expect(cred.emailVerifiedAt).toBeNull();
  });

  it('creates a credential without a password (OAuth-only) with no password provider', () => {
    const cred = UserCredential.register('user-1', email, null);
    expect(cred.hasPassword).toBe(false);
    expect(cred.hasProvider('password')).toBe(false);
  });

  it('records CredentialRegistered', () => {
    const cred = UserCredential.register('user-1', email, password);
    const events = cred.pullDomainEvents();
    expect(events.map((e) => e.eventType)).toEqual([CREDENTIAL_REGISTERED]);
  });
});

describe('UserCredential.verifyEmail', () => {
  it('sets emailVerifiedAt and records EmailVerified', async () => {
    const cred = await registered();
    cred.verifyEmail(new Date('2026-01-15T00:00:00Z'));
    expect(cred.emailVerifiedAt).toEqual(new Date('2026-01-15T00:00:00Z'));
    const events = cred.pullDomainEvents();
    expect(events.map((e) => e.eventType)).toEqual([EMAIL_VERIFIED]);
  });

  it('rejects double verification', async () => {
    const cred = await registered();
    cred.verifyEmail();
    expect(() => cred.verifyEmail()).toThrow(EmailAlreadyVerifiedError);
  });
});

describe('UserCredential.attemptPassword', () => {
  it('returns true for the matching password', async () => {
    const cred = await registered();
    const plaintext = PlaintextPassword.create('correcthorse1battery');
    // stubHasher hashes as "hashed(<plaintext>)"; the credential above stores
    // that exact hash, so verify() will match.
    // seed the cred's hash to match what the stub produces
    cred.changePassword(HashedPassword.create('argon2id', `hashed(${plaintext.reveal()})`), 'logout', null);
    cred.pullDomainEvents();
    const ok = await cred.attemptPassword(plaintext, stubHasher);
    expect(ok).toBe(true);
  });

  it('returns false for a wrong password', async () => {
    const cred = await registered();
    const plaintext = PlaintextPassword.create('wrongpassword1abc');
    const ok = await cred.attemptPassword(plaintext, stubHasher);
    expect(ok).toBe(false);
  });

  it('returns false for an OAuth-only credential (no password)', async () => {
    const cred = UserCredential.register('user-1', email, null);
    const plaintext = PlaintextPassword.create('correcthorse1battery');
    const ok = await cred.attemptPassword(plaintext, stubHasher);
    expect(ok).toBe(false);
  });
});

describe('UserCredential.changePassword', () => {
  it('revokes all active sessions except keepSessionId', async () => {
    const cred = await registered();
    const session1 = cred.startSession('rt-1', new Date(Date.now() + 3600_000), null, null);
    const session2 = cred.startSession('rt-2', new Date(Date.now() + 3600_000), null, null);
    cred.pullDomainEvents();

    const newHash = HashedPassword.create('argon2id', 'new');
    cred.changePassword(newHash, 'password_changed', session1.id);

    expect(session1.revokedAt).toBeNull();
    expect(session2.revokedAt).not.toBeNull();
    const events = cred.pullDomainEvents().map((e) => e.eventType);
    expect(events).toContain(SESSION_REVOKED);
    expect(events).toContain(PASSWORD_CHANGED);
  });

  it('revokes ALL sessions when keepSessionId is null (reset flow)', async () => {
    const cred = await registered();
    const s1 = cred.startSession('rt-1', new Date(Date.now() + 3600_000), null, null);
    const s2 = cred.startSession('rt-2', new Date(Date.now() + 3600_000), null, null);
    cred.pullDomainEvents();

    cred.changePassword(HashedPassword.create('argon2id', 'new'), 'password_reset', null);

    expect(s1.revokedAt).not.toBeNull();
    expect(s2.revokedAt).not.toBeNull();
  });
});

describe('UserCredential session lifecycle', () => {
  it('startSession returns a session and records SessionStarted', async () => {
    const cred = await registered();
    const session = cred.startSession(
      'refresh-hash',
      new Date(Date.now() + 3600_000),
      'iPhone',
      '192.168.1.1',
    );
    expect(session.userCredentialId).toBe(cred.id);
    expect(session.deviceLabel).toBe('iPhone');
    const events = cred.pullDomainEvents();
    expect(events.map((e) => e.eventType)).toEqual([SESSION_STARTED]);
  });

  it('rotateSession revokes the old session and creates a new one', async () => {
    const cred = await registered();
    const oldSession = cred.startSession('old-hash', new Date(Date.now() + 3600_000), null, null);
    cred.pullDomainEvents();

    const newSession = cred.rotateSession(oldSession.id, 'new-hash', new Date(Date.now() + 3600_000));

    expect(oldSession.revokedAt).not.toBeNull();
    expect(newSession.refreshTokenHash).toBe('new-hash');
    const events = cred.pullDomainEvents().map((e) => e.eventType);
    expect(events).toContain(SESSION_REVOKED);
    expect(events).toContain(SESSION_STARTED);
  });

  it('revokeSession revokes the named session and records SessionRevoked', async () => {
    const cred = await registered();
    const session = cred.startSession('rt', new Date(Date.now() + 3600_000), null, null);
    cred.pullDomainEvents();

    cred.revokeSession(session.id, 'logout');
    expect(session.revokedAt).not.toBeNull();
    expect(cred.pullDomainEvents().map((e) => e.eventType)).toEqual([SESSION_REVOKED]);
  });

  it('revokeSession is idempotent — no duplicate event', async () => {
    const cred = await registered();
    const session = cred.startSession('rt', new Date(Date.now() + 3600_000), null, null);
    cred.revokeSession(session.id, 'logout');
    cred.pullDomainEvents();

    cred.revokeSession(session.id, 'logout'); // second call
    expect(cred.pullDomainEvents()).toHaveLength(0);
  });

  it('revokeSession throws for an unknown session id', async () => {
    const cred = await registered();
    expect(() => cred.revokeSession('does-not-exist', 'logout')).toThrow(SessionNotFoundError);
  });

  it('revokeAllSessions revokes every active session', async () => {
    const cred = await registered();
    const s1 = cred.startSession('rt-1', new Date(Date.now() + 3600_000), null, null);
    const s2 = cred.startSession('rt-2', new Date(Date.now() + 3600_000), null, null);
    cred.pullDomainEvents();

    cred.revokeAllSessions('logout_everywhere');
    expect(s1.revokedAt).not.toBeNull();
    expect(s2.revokedAt).not.toBeNull();
    expect(cred.pullDomainEvents().length).toBe(2);
  });

  it('revokeAllForTokenReuse revokes everything as a theft response', async () => {
    const cred = await registered();
    const s1 = cred.startSession('rt-1', new Date(Date.now() + 3600_000), null, null);
    cred.pullDomainEvents();

    cred.revokeAllForTokenReuse();
    expect(s1.revokedAt).not.toBeNull();
    const events = cred.pullDomainEvents();
    expect(events[0]?.eventType).toBe(SESSION_REVOKED);
  });
});

describe('UserCredential verification tokens', () => {
  it('issueVerificationToken adds a token to the aggregate', async () => {
    const cred = await registered();
    const token = cred.issueVerificationToken(
      'email_verification',
      'hash-abc',
      new Date(Date.now() + 86_400_000),
    );
    expect(cred.tokens).toHaveLength(1);
    expect(token.purpose).toBe('email_verification');
  });

  it('consumeVerificationToken marks the token consumed', async () => {
    const cred = await registered();
    cred.issueVerificationToken('email_verification', 'hash', new Date(Date.now() + 86_400_000));
    const consumed = cred.consumeVerificationToken('email_verification', 'hash');
    expect(consumed.consumedAt).not.toBeNull();
  });

  it('consumeVerificationToken throws for an unknown hash', async () => {
    const cred = await registered();
    expect(() => cred.consumeVerificationToken('email_verification', 'nope')).toThrow(
      VerificationTokenNotFoundError,
    );
  });

  it('consumeVerificationToken rejects a reused token', async () => {
    const cred = await registered();
    cred.issueVerificationToken('email_verification', 'hash', new Date(Date.now() + 86_400_000));
    cred.consumeVerificationToken('email_verification', 'hash');
    expect(() => cred.consumeVerificationToken('email_verification', 'hash')).toThrow(
      VerificationTokenAlreadyConsumedError,
    );
  });
});

describe('UserCredential.findActiveSessionByRefreshTokenHash', () => {
  it('returns the active session', async () => {
    const cred = await registered();
    const session = cred.startSession('rt', new Date(Date.now() + 3600_000), null, null);
    const found = cred.findActiveSessionByRefreshTokenHash('rt');
    expect(found.id).toBe(session.id);
  });

  it('throws InvalidCredentialsError for an unknown hash', async () => {
    const cred = await registered();
    expect(() => cred.findActiveSessionByRefreshTokenHash('nope')).toThrow(InvalidCredentialsError);
  });
});
