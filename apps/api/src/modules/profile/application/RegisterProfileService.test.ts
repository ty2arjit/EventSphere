import { describe, expect, it } from 'vitest';
import { RegisterProfileService } from './RegisterProfileService';
import { InMemoryProfileRepository } from '../test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from '../test-support/RecordingEventPublisher';
import { EmailAlreadyRegisteredError } from './errors';
import { InvalidEmailError } from '../domain/errors';
import { ProfileRepository } from '../domain/ProfileRepository';
import { User } from '../domain/User';
import { UniqueConstraintViolationError } from '../../../shared/errors/UniqueConstraintViolationError';
import { PROFILE_REGISTERED, ProfileRegisteredPayload } from '../domain/events/ProfileRegistered';

function buildService(repository: ProfileRepository = new InMemoryProfileRepository()) {
  const eventPublisher = new RecordingEventPublisher();
  return { service: new RegisterProfileService(repository, eventPublisher), eventPublisher };
}

describe('RegisterProfileService', () => {
  it('registers a new profile and persists it via the repository', async () => {
    const repository = new InMemoryProfileRepository();
    const { service } = buildService(repository);

    const user = await service.execute({ email: 'new@example.com', name: 'New User' });

    expect(user.email).toBe('new@example.com');
    const persisted = await repository.findByEmail('new@example.com');
    expect(persisted).not.toBeNull();
    expect(persisted?.id).toBe(user.id);
  });

  it('publishes ProfileRegistered after a successful registration', async () => {
    const { service, eventPublisher } = buildService();

    const user = await service.execute({ email: 'events@example.com', name: 'Event User' });

    expect(eventPublisher.published).toHaveLength(1);
    const [event] = eventPublisher.published;
    expect(event?.eventType).toBe(PROFILE_REGISTERED);
    expect(event?.aggregateId).toBe(user.id);
    expect(event?.aggregateType).toBe('User');
    expect(event?.correlationId).toBeTruthy();
    expect((event?.payload as ProfileRegisteredPayload).email).toBe('events@example.com');
  });

  it('rejects registration when the email is already taken', async () => {
    const { service, eventPublisher } = buildService();

    await service.execute({ email: 'taken@example.com', name: 'First' });
    eventPublisher.published.length = 0;

    await expect(
      service.execute({ email: 'taken@example.com', name: 'Second' }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);

    // No event may announce a registration that never happened.
    expect(eventPublisher.published).toHaveLength(0);
  });

  it('propagates domain validation errors without swallowing them', async () => {
    const { service } = buildService();

    await expect(
      service.execute({ email: 'not-an-email', name: 'Someone' }),
    ).rejects.toThrow(InvalidEmailError);
  });

  /**
   * M2 — concurrency guard. Simulates two requests racing: the pre-check finds
   * no existing user, but the database rejects the insert because another
   * request won. The infrastructure-level error must surface as the same
   * business error a sequential duplicate would produce.
   */
  it('translates a racing unique-constraint violation into EmailAlreadyRegisteredError', async () => {
    const racingRepository: ProfileRepository = {
      async findByEmail(): Promise<User | null> {
        return null; // pre-check passes — the competing insert hasn't landed yet
      },
      async save(): Promise<void> {
        throw new UniqueConstraintViolationError('email');
      },
    };

    const { service, eventPublisher } = buildService(racingRepository);

    await expect(
      service.execute({ email: 'race@example.com', name: 'Racer' }),
    ).rejects.toThrow(EmailAlreadyRegisteredError);

    expect(eventPublisher.published).toHaveLength(0);
  });

  it('does not swallow unexpected repository failures', async () => {
    const failingRepository: ProfileRepository = {
      async findByEmail(): Promise<User | null> {
        return null;
      },
      async save(): Promise<void> {
        throw new Error('connection lost');
      },
    };

    const { service } = buildService(failingRepository);

    await expect(
      service.execute({ email: 'boom@example.com', name: 'Boom' }),
    ).rejects.toThrow('connection lost');
  });
});
