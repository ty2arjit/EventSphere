/**
 * Covers RequestEmailVerificationService, ConfirmEmailVerificationService,
 * RequestPasswordResetService, CompletePasswordResetService, and
 * ChangePasswordService in one file — each service is small and shares
 * the same scenario setup.
 */
import { describe, expect, it } from 'vitest';
import { RegisterCredentialService } from './RegisterCredentialService';
import { AuthenticateWithPasswordService } from './AuthenticateWithPasswordService';
import { RequestEmailVerificationService } from './RequestEmailVerificationService';
import { ConfirmEmailVerificationService } from './ConfirmEmailVerificationService';
import { RequestPasswordResetService } from './RequestPasswordResetService';
import { CompletePasswordResetService } from './CompletePasswordResetService';
import { ChangePasswordService } from './ChangePasswordService';
import { LogoutService } from './LogoutService';
import { LogoutEverywhereService } from './LogoutEverywhereService';
import { InMemoryUserCredentialRepository } from '../test-support/InMemoryUserCredentialRepository';
import { RecordingEventPublisher } from '../../profile/test-support/RecordingEventPublisher';
import {
  FakeJwtService,
  FakePasswordHasher,
  FakeTokenHasher,
  InMemoryProfileGateway,
  RecordingMailer,
  SequentialTokenGenerator,
} from '../test-support/fakes';
import { DEFAULT_AUTH_CONFIG } from './AuthConfig';
import {
  InvalidCredentialsError,
  VerificationTokenNotFoundError,
} from '../domain/errors';
import { EMAIL_VERIFIED } from '../domain/events/EmailVerified';
import { PASSWORD_CHANGED } from '../domain/events/PasswordChanged';
import { SESSION_REVOKED } from '../domain/events/SessionRevoked';

async function scenario() {
  const credentialRepository = new InMemoryUserCredentialRepository();
  const profileGateway = new InMemoryProfileGateway();
  const eventPublisher = new RecordingEventPublisher();
  const mailer = new RecordingMailer();
  const passwordHasher = new FakePasswordHasher();
  const tokenHasher = new FakeTokenHasher();
  const tokenGenerator = new SequentialTokenGenerator();
  const jwtService = new FakeJwtService();

  const register = new RegisterCredentialService(
    credentialRepository,
    profileGateway,
    passwordHasher,
    tokenHasher,
    tokenGenerator,
    eventPublisher,
    mailer,
    DEFAULT_AUTH_CONFIG,
  );
  const auth = new AuthenticateWithPasswordService(
    credentialRepository,
    passwordHasher,
    tokenHasher,
    tokenGenerator,
    jwtService,
    eventPublisher,
    DEFAULT_AUTH_CONFIG,
  );
  const requestVerify = new RequestEmailVerificationService(
    credentialRepository,
    tokenHasher,
    tokenGenerator,
    mailer,
    DEFAULT_AUTH_CONFIG,
  );
  const confirmVerify = new ConfirmEmailVerificationService(
    credentialRepository,
    tokenHasher,
    eventPublisher,
  );
  const requestReset = new RequestPasswordResetService(
    credentialRepository,
    tokenHasher,
    tokenGenerator,
    mailer,
    DEFAULT_AUTH_CONFIG,
  );
  const completeReset = new CompletePasswordResetService(
    credentialRepository,
    passwordHasher,
    tokenHasher,
    eventPublisher,
  );
  const changePassword = new ChangePasswordService(
    credentialRepository,
    passwordHasher,
    eventPublisher,
  );
  const logout = new LogoutService(credentialRepository, eventPublisher);
  const logoutAll = new LogoutEverywhereService(credentialRepository, eventPublisher);

  await register.execute({
    email: 'jane@example.com',
    name: 'Jane',
    password: 'correcthorse1battery',
  });

  return {
    credentialRepository,
    eventPublisher,
    mailer,
    auth,
    requestVerify,
    confirmVerify,
    requestReset,
    completeReset,
    changePassword,
    logout,
    logoutAll,
  };
}

describe('ConfirmEmailVerificationService', () => {
  it('verifies the credential and publishes EmailVerified', async () => {
    const { confirmVerify, mailer, credentialRepository, eventPublisher } = await scenario();
    // Verification email was sent during register; extract the raw token
    // from the link URL.
    const link = mailer.sent[0]?.link ?? '';
    const rawToken = link.split('/').pop() ?? '';
    eventPublisher.published.length = 0;

    const result = await confirmVerify.execute(rawToken);

    expect(result.userCredentialId).toBeTruthy();
    const cred = await credentialRepository.findByEmail('jane@example.com');
    expect(cred?.emailVerifiedAt).not.toBeNull();
    expect(eventPublisher.published.map((e) => e.eventType)).toContain(EMAIL_VERIFIED);
  });

  it('rejects an unknown token', async () => {
    const { confirmVerify } = await scenario();
    await expect(confirmVerify.execute('bogus')).rejects.toThrow(VerificationTokenNotFoundError);
  });

  it('rejects a token used twice', async () => {
    const { confirmVerify, mailer } = await scenario();
    const rawToken = mailer.sent[0]?.link.split('/').pop() ?? '';
    await confirmVerify.execute(rawToken);
    await expect(confirmVerify.execute(rawToken)).rejects.toThrow();
  });
});

describe('RequestEmailVerificationService', () => {
  it('issues another token if the credential is unverified', async () => {
    const { requestVerify, mailer, credentialRepository } = await scenario();
    const cred = await credentialRepository.findByEmail('jane@example.com');
    mailer.sent.length = 0;

    await requestVerify.execute(cred!.id);

    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]?.kind).toBe('verify');
  });

  it('does nothing for an unknown credential (no exception, no email)', async () => {
    const { requestVerify, mailer } = await scenario();
    mailer.sent.length = 0;
    await requestVerify.execute('unknown-id');
    expect(mailer.sent).toHaveLength(0);
  });

  it('does nothing for an already-verified credential (idempotent)', async () => {
    const { requestVerify, confirmVerify, mailer, credentialRepository } = await scenario();
    const rawToken = mailer.sent[0]?.link.split('/').pop() ?? '';
    await confirmVerify.execute(rawToken);
    mailer.sent.length = 0;

    const cred = await credentialRepository.findByEmail('jane@example.com');
    await requestVerify.execute(cred!.id);
    expect(mailer.sent).toHaveLength(0);
  });
});

describe('RequestPasswordResetService', () => {
  it('sends a reset email when the address is known', async () => {
    const { requestReset, mailer } = await scenario();
    mailer.sent.length = 0;
    await requestReset.execute('jane@example.com');
    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]?.kind).toBe('reset');
  });

  it('does nothing for an unknown email (BL-002)', async () => {
    const { requestReset, mailer } = await scenario();
    mailer.sent.length = 0;
    await requestReset.execute('unknown@example.com');
    expect(mailer.sent).toHaveLength(0);
  });

  it('does nothing for a malformed email (BL-002)', async () => {
    const { requestReset, mailer } = await scenario();
    mailer.sent.length = 0;
    await requestReset.execute('not-an-email');
    expect(mailer.sent).toHaveLength(0);
  });
});

describe('CompletePasswordResetService', () => {
  it('updates the password, consumes the token, and revokes all sessions', async () => {
    const {
      auth,
      requestReset,
      completeReset,
      credentialRepository,
      mailer,
      eventPublisher,
    } = await scenario();

    // Give the user an active session, then request + complete a reset.
    await auth.execute({ email: 'jane@example.com', password: 'correcthorse1battery' });
    mailer.sent.length = 0;
    await requestReset.execute('jane@example.com');
    const rawToken = mailer.sent[0]?.link.split('/').pop() ?? '';
    eventPublisher.published.length = 0;

    await completeReset.execute({ rawToken, newPassword: 'brandnewpassword1' });

    const cred = await credentialRepository.findByEmail('jane@example.com');
    expect(cred?.sessions.every((s) => s.revokedAt !== null)).toBe(true);
    const events = eventPublisher.published.map((e) => e.eventType);
    expect(events).toContain(PASSWORD_CHANGED);
    expect(events).toContain(SESSION_REVOKED);
  });

  it('rejects an unknown reset token', async () => {
    const { completeReset } = await scenario();
    await expect(
      completeReset.execute({ rawToken: 'bogus', newPassword: 'brandnewpassword1' }),
    ).rejects.toThrow(VerificationTokenNotFoundError);
  });

  it('allows login with the new password after a completed reset', async () => {
    const { auth, requestReset, completeReset, mailer } = await scenario();
    mailer.sent.length = 0;
    await requestReset.execute('jane@example.com');
    const rawToken = mailer.sent[0]?.link.split('/').pop() ?? '';
    await completeReset.execute({ rawToken, newPassword: 'brandnewpassword1' });

    // Old password no longer works
    await expect(
      auth.execute({ email: 'jane@example.com', password: 'correcthorse1battery' }),
    ).rejects.toThrow(InvalidCredentialsError);
    // New password does
    const result = await auth.execute({ email: 'jane@example.com', password: 'brandnewpassword1' });
    expect(result.accessToken).toBeTruthy();
  });
});

describe('ChangePasswordService', () => {
  it('rejects with InvalidCredentialsError when the current password is wrong', async () => {
    const { auth, changePassword, credentialRepository } = await scenario();
    const login = await auth.execute({
      email: 'jane@example.com',
      password: 'correcthorse1battery',
    });
    const cred = await credentialRepository.findByEmail('jane@example.com');

    await expect(
      changePassword.execute({
        userCredentialId: cred!.id,
        currentPassword: 'wrongpassword1abc',
        newPassword: 'brandnewpassword1',
        keepSessionId: login.sessionId,
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('updates the password and revokes OTHER sessions, keeping the current one', async () => {
    const { auth, changePassword, credentialRepository } = await scenario();
    const session1 = await auth.execute({
      email: 'jane@example.com',
      password: 'correcthorse1battery',
    });
    const session2 = await auth.execute({
      email: 'jane@example.com',
      password: 'correcthorse1battery',
    });
    const cred = await credentialRepository.findByEmail('jane@example.com');

    await changePassword.execute({
      userCredentialId: cred!.id,
      currentPassword: 'correcthorse1battery',
      newPassword: 'brandnewpassword1',
      keepSessionId: session1.sessionId,
    });

    const refreshed = await credentialRepository.findByEmail('jane@example.com');
    const kept = refreshed?.sessions.find((s) => s.id === session1.sessionId);
    const other = refreshed?.sessions.find((s) => s.id === session2.sessionId);
    expect(kept?.revokedAt).toBeNull();
    expect(other?.revokedAt).not.toBeNull();
  });
});

describe('LogoutService', () => {
  it('revokes a single session', async () => {
    const { auth, logout, credentialRepository } = await scenario();
    const login = await auth.execute({
      email: 'jane@example.com',
      password: 'correcthorse1battery',
    });
    const cred = await credentialRepository.findByEmail('jane@example.com');

    await logout.execute({ userCredentialId: cred!.id, sessionId: login.sessionId });

    const refreshed = await credentialRepository.findByEmail('jane@example.com');
    const session = refreshed?.sessions.find((s) => s.id === login.sessionId);
    expect(session?.revokedAt).not.toBeNull();
  });
});

describe('LogoutEverywhereService', () => {
  it('revokes every active session', async () => {
    const { auth, logoutAll, credentialRepository } = await scenario();
    await auth.execute({ email: 'jane@example.com', password: 'correcthorse1battery' });
    await auth.execute({ email: 'jane@example.com', password: 'correcthorse1battery' });
    const cred = await credentialRepository.findByEmail('jane@example.com');

    await logoutAll.execute(cred!.id);

    const refreshed = await credentialRepository.findByEmail('jane@example.com');
    expect(refreshed?.sessions.every((s) => s.revokedAt !== null)).toBe(true);
  });
});
