import { describe, expect, it } from 'vitest';
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
} from '../test-support/fakes';
import { DEFAULT_AUTH_CONFIG } from './AuthConfig';
import { InvalidCredentialsError } from '../domain/errors';
import { SESSION_STARTED } from '../domain/events/SessionStarted';

async function scenario() {
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

  await registerService.execute({
    email: 'jane@example.com',
    name: 'Jane',
    password: 'correcthorse1battery',
  });
  eventPublisher.published.length = 0;

  return { authService, credentialRepository, eventPublisher };
}

describe('AuthenticateWithPasswordService', () => {
  it('returns tokens and starts a session for a correct password', async () => {
    const { authService, eventPublisher } = await scenario();

    const result = await authService.execute({
      email: 'jane@example.com',
      password: 'correcthorse1battery',
      deviceLabel: 'iPhone',
    });

    expect(result.accessToken).toContain('access:');
    expect(result.refreshToken).toContain('token-'); // sequential fake
    expect(result.sessionId).toBeTruthy();
    expect(eventPublisher.published.map((e) => e.eventType)).toContain(SESSION_STARTED);
  });

  it('throws InvalidCredentialsError for a wrong password', async () => {
    const { authService } = await scenario();
    await expect(
      authService.execute({
        email: 'jane@example.com',
        password: 'wrongpassword1abc',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('throws InvalidCredentialsError for an unknown email — same as wrong password (BL-002)', async () => {
    const { authService } = await scenario();
    await expect(
      authService.execute({
        email: 'unknown@example.com',
        password: 'correcthorse1battery',
      }),
    ).rejects.toThrow(InvalidCredentialsError);
  });

  it('throws InvalidCredentialsError for a malformed email — same generic error', async () => {
    const { authService } = await scenario();
    await expect(
      authService.execute({ email: 'not-an-email', password: 'correcthorse1battery' }),
    ).rejects.toThrow(InvalidCredentialsError);
  });
});
