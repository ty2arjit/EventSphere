import { describe, expect, it } from 'vitest';
import { RefreshSessionService } from './RefreshSessionService';
import { AuthenticateWithPasswordService } from './AuthenticateWithPasswordService';
import { RegisterCredentialService } from './RegisterCredentialService';
import { InMemoryUserCredentialRepository } from '../test-support/InMemoryUserCredentialRepository';
import { RecordingEventPublisher } from '../../profile/test-support/RecordingEventPublisher';
import {
  FakeJwtService,
  FakePasswordHasher,
  FakeTokenHasher,
  InMemoryProfileGateway,
  RecordingMailer,
  SequentialTokenGenerator,
  SequentialOtpGenerator,
} from '../test-support/fakes';
import { DEFAULT_AUTH_CONFIG } from './AuthConfig';
import { InvalidCredentialsError } from '../domain/errors';
import { SESSION_REVOKED, SessionRevokedPayload } from '../domain/events/SessionRevoked';

async function loggedInScenario() {
  const credentialRepository = new InMemoryUserCredentialRepository();
  const profileGateway = new InMemoryProfileGateway();
  const eventPublisher = new RecordingEventPublisher();
  const mailer = new RecordingMailer();
  const passwordHasher = new FakePasswordHasher();
  const tokenHasher = new FakeTokenHasher();
  const tokenGenerator = new SequentialTokenGenerator();
  const jwtService = new FakeJwtService();

  const registerService = new RegisterCredentialService(
    credentialRepository,
    profileGateway,
    passwordHasher,
    tokenHasher,
    tokenGenerator,
    new SequentialOtpGenerator(),
    eventPublisher,
    mailer,
    DEFAULT_AUTH_CONFIG,
  );
  const authService = new AuthenticateWithPasswordService(
    credentialRepository,
    passwordHasher,
    tokenHasher,
    tokenGenerator,
    jwtService,
    eventPublisher,
    DEFAULT_AUTH_CONFIG,
  );
  const refreshService = new RefreshSessionService(
    credentialRepository,
    tokenHasher,
    tokenGenerator,
    jwtService,
    eventPublisher,
    DEFAULT_AUTH_CONFIG,
  );

  await registerService.execute({
    email: 'jane@example.com',
    name: 'Jane',
    password: 'correcthorse1battery',
  });
  const loggedIn = await authService.execute({
    email: 'jane@example.com',
    password: 'correcthorse1battery',
  });
  eventPublisher.published.length = 0;

  return { refreshService, credentialRepository, eventPublisher, loggedIn };
}

describe('RefreshSessionService', () => {
  it('rotates the refresh token and issues a new access token', async () => {
    const { refreshService, loggedIn } = await loggedInScenario();

    const result = await refreshService.execute(loggedIn.refreshToken);

    expect(result.refreshToken).not.toBe(loggedIn.refreshToken);
    expect(result.sessionId).not.toBe(loggedIn.sessionId);
    expect(result.accessToken).toContain('access:');
  });

  it('rejects a token that never existed', async () => {
    const { refreshService } = await loggedInScenario();
    await expect(refreshService.execute('never-issued')).rejects.toThrow(InvalidCredentialsError);
  });

  it('detects reuse of a rotated token and revokes ALL sessions', async () => {
    const { refreshService, credentialRepository, eventPublisher, loggedIn } =
      await loggedInScenario();

    // Legitimate rotation
    await refreshService.execute(loggedIn.refreshToken);
    eventPublisher.published.length = 0;

    // Attacker (or a buggy client) presents the original — should trigger
    // theft response.
    await expect(refreshService.execute(loggedIn.refreshToken)).rejects.toThrow(
      InvalidCredentialsError,
    );

    const credential = await credentialRepository.findById(loggedIn.sessionId.split('-')[0] ?? '');
    // Locate the credential by iterating (the sessionId isn't the userId
    // — we can look it up by email instead).
    const cred = await credentialRepository.findByEmail('jane@example.com');
    expect(cred).not.toBeNull();
    const activeSessions = cred!.sessions.filter((s) => s.revokedAt === null);
    expect(activeSessions).toHaveLength(0); // everything revoked
    const revokeEvents = eventPublisher.published.filter((e) => e.eventType === SESSION_REVOKED);
    expect(revokeEvents.length).toBeGreaterThan(0);
    expect((revokeEvents[0]?.payload as SessionRevokedPayload).reason).toBe(
      'refresh_token_reuse_detected',
    );
  });
});
