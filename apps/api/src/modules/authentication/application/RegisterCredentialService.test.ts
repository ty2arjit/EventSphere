import { describe, expect, it } from 'vitest';
import { RegisterCredentialService } from './RegisterCredentialService';
import { InMemoryUserCredentialRepository } from '../test-support/InMemoryUserCredentialRepository';
import { RecordingEventPublisher } from '../../profile/test-support/RecordingEventPublisher';
import {
  FakePasswordHasher,
  FakeTokenHasher,
  SequentialTokenGenerator,
  RecordingMailer,
  InMemoryProfileGateway,
} from '../test-support/fakes';
import { DEFAULT_AUTH_CONFIG } from './AuthConfig';
import { CREDENTIAL_REGISTERED } from '../domain/events/CredentialRegistered';
import { WeakPasswordError } from '../domain/errors';
import { InvalidEmailAddressError } from '../domain/valueObjects/EmailAddress';

function build() {
  const credentialRepository = new InMemoryUserCredentialRepository();
  const profileGateway = new InMemoryProfileGateway();
  const eventPublisher = new RecordingEventPublisher();
  const mailer = new RecordingMailer();
  const service = new RegisterCredentialService(
    credentialRepository,
    profileGateway,
    new FakePasswordHasher(),
    new FakeTokenHasher(),
    new SequentialTokenGenerator(),
    eventPublisher,
    mailer,
    DEFAULT_AUTH_CONFIG,
  );
  return { service, credentialRepository, profileGateway, eventPublisher, mailer };
}

describe('RegisterCredentialService', () => {
  it('creates a Profile, a Credential, a verification token, and sends the email', async () => {
    const { service, credentialRepository, profileGateway, eventPublisher, mailer } = build();

    await service.execute({
      email: 'new@example.com',
      name: 'New User',
      password: 'correcthorse1battery',
    });

    expect(profileGateway.createdProfiles).toHaveLength(1);
    expect(profileGateway.createdProfiles[0]?.email).toBe('new@example.com');

    const credential = await credentialRepository.findByEmail('new@example.com');
    expect(credential).not.toBeNull();
    expect(credential?.hasPassword).toBe(true);
    expect(credential?.tokens).toHaveLength(1);
    expect(credential?.tokens[0]?.purpose).toBe('email_verification');

    expect(mailer.sent).toHaveLength(1);
    expect(mailer.sent[0]?.kind).toBe('verify');
    expect(mailer.sent[0]?.link).toContain('/email/verify/token-1');

    expect(eventPublisher.published.map((e) => e.eventType)).toContain(CREDENTIAL_REGISTERED);
  });

  it('silently returns for an email that already has a credential (BL-002)', async () => {
    const { service, credentialRepository, profileGateway, mailer } = build();
    await service.execute({
      email: 'existing@example.com',
      name: 'First',
      password: 'correcthorse1battery',
    });
    mailer.sent.length = 0;
    const initialCreatedCount = profileGateway.createdProfiles.length;

    // Second registration attempt for the same email — should be a no-op
    // externally observable-wise.
    await service.execute({
      email: 'existing@example.com',
      name: 'Second',
      password: 'differentpassword1abc',
    });

    expect(mailer.sent).toHaveLength(0); // no email sent to the enumerator
    expect(profileGateway.createdProfiles).toHaveLength(initialCreatedCount); // no new profile
    const credential = await credentialRepository.findByEmail('existing@example.com');
    expect(credential?.tokens).toHaveLength(1); // still just the first one
  });

  it('rejects a weak password before touching anything', async () => {
    const { service, profileGateway, credentialRepository } = build();

    await expect(
      service.execute({ email: 'weak@example.com', name: 'Weak', password: 'short' }),
    ).rejects.toThrow(WeakPasswordError);

    expect(profileGateway.createdProfiles).toHaveLength(0);
    expect(await credentialRepository.findByEmail('weak@example.com')).toBeNull();
  });

  it('rejects a malformed email before touching anything', async () => {
    const { service, profileGateway } = build();
    await expect(
      service.execute({ email: 'not-an-email', name: 'X', password: 'correcthorse1battery' }),
    ).rejects.toThrow(InvalidEmailAddressError);
    expect(profileGateway.createdProfiles).toHaveLength(0);
  });
});
