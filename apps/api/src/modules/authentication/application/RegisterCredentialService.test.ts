import { describe, expect, it } from 'vitest';
import { RegisterCredentialService } from './RegisterCredentialService';
import { InMemoryUserCredentialRepository } from '../test-support/InMemoryUserCredentialRepository';
import { RecordingEventPublisher } from '../../profile/test-support/RecordingEventPublisher';
import {
  FakePasswordHasher,
  FakeTokenHasher,
  SequentialTokenGenerator,
  SequentialOtpGenerator,
  RecordingMailer,
  InMemoryProfileGateway,
} from '../test-support/fakes';
import { DEFAULT_AUTH_CONFIG } from './AuthConfig';
import { CREDENTIAL_REGISTERED } from '../domain/events/CredentialRegistered';
import { WeakPasswordError } from '../domain/errors';
import { InvalidEmailAddressError } from '../domain/valueObjects/EmailAddress';
import type { Mailer } from '../infrastructure/Mailer';

/** Simulates a real mail-provider failure (rate limit, rejected recipient, network error). */
class ThrowingMailer implements Mailer {
  async sendVerificationEmail(): Promise<void> {
    throw new Error('mail provider rejected the request');
  }
  async sendVerificationOtp(): Promise<void> {
    throw new Error('mail provider rejected the request');
  }
  async sendPasswordResetEmail(): Promise<void> {
    throw new Error('mail provider rejected the request');
  }
}

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
    new SequentialOtpGenerator(),
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
    expect(credential?.tokens).toHaveLength(2);
    expect(credential?.tokens.every((t) => t.purpose === 'email_verification')).toBe(true);

    expect(mailer.sent).toHaveLength(2);
    expect(mailer.sent[0]).toMatchObject({ kind: 'verify', link: expect.stringContaining('/email/verify/token-1') });
    expect(mailer.sent[1]).toMatchObject({ kind: 'otp', code: '000001' });

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
    expect(credential?.tokens).toHaveLength(2); // still just the first pair (link + otp)
  });

  it('still creates the account even if the mail provider throws (registration must not 500 on a flaky email send)', async () => {
    const credentialRepository = new InMemoryUserCredentialRepository();
    const profileGateway = new InMemoryProfileGateway();
    const eventPublisher = new RecordingEventPublisher();
    const service = new RegisterCredentialService(
      credentialRepository,
      profileGateway,
      new FakePasswordHasher(),
      new FakeTokenHasher(),
      new SequentialTokenGenerator(),
      new SequentialOtpGenerator(),
      eventPublisher,
      new ThrowingMailer(),
      DEFAULT_AUTH_CONFIG,
    );

    await expect(
      service.execute({ email: 'mailfail@example.com', name: 'Mail Fail', password: 'correcthorse1battery' }),
    ).resolves.toBeUndefined();

    const credential = await credentialRepository.findByEmail('mailfail@example.com');
    expect(credential).not.toBeNull();
    expect(credential?.hasPassword).toBe(true);
    expect(eventPublisher.published.map((e) => e.eventType)).toContain(CREDENTIAL_REGISTERED);
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
