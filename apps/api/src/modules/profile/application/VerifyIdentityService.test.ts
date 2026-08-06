import { describe, expect, it } from 'vitest';
import { VerifyIdentityService } from './VerifyIdentityService';
import { InMemoryProfileRepository } from '../test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from '../test-support/RecordingEventPublisher';
import { User } from '../domain/User';
import { ProfileNotFoundError } from './errors';
import { AlreadyVerifiedError } from '../domain/errors';
import { PROFILE_VERIFIED } from '../domain/events/ProfileVerified';

describe('VerifyIdentityService', () => {
  it('verifies the profile and publishes ProfileVerified', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const user = User.register('a@example.com', 'A');
    await repository.save(user);
    user.pullDomainEvents(); // clear ProfileRegistered — not this test's concern

    const service = new VerifyIdentityService(repository, eventPublisher);
    const verified = await service.execute(user.id);

    expect(verified.status).toBe('verified');
    expect(eventPublisher.published).toHaveLength(1);
    expect(eventPublisher.published[0]?.eventType).toBe(PROFILE_VERIFIED);
  });

  it('propagates AlreadyVerifiedError without swallowing it', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const user = User.register('a@example.com', 'A');
    await repository.save(user);

    const service = new VerifyIdentityService(repository, eventPublisher);
    await service.execute(user.id);

    await expect(service.execute(user.id)).rejects.toThrow(AlreadyVerifiedError);
  });

  it('throws ProfileNotFoundError for an unknown id', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const service = new VerifyIdentityService(repository, eventPublisher);

    await expect(service.execute('does-not-exist')).rejects.toThrow(ProfileNotFoundError);
  });
});
