import { describe, expect, it } from 'vitest';
import { UpdateProfileService } from './UpdateProfileService';
import { InMemoryProfileRepository } from '../test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from '../test-support/RecordingEventPublisher';
import { User } from '../domain/User';
import { ProfileNotFoundError } from './errors';
import { PROFILE_UPDATED } from '../domain/events/ProfileUpdated';

describe('UpdateProfileService', () => {
  it('updates the profile and publishes ProfileUpdated', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const user = User.register('a@example.com', 'A');
    await repository.save(user);
    user.pullDomainEvents(); // clear ProfileRegistered — not this test's concern

    const service = new UpdateProfileService(repository, eventPublisher);
    const updated = await service.execute({ id: user.id, patch: { bio: 'Hello' } });

    expect(updated.profile.bio).toBe('Hello');
    expect(eventPublisher.published).toHaveLength(1);
    expect(eventPublisher.published[0]?.eventType).toBe(PROFILE_UPDATED);
  });

  it('throws ProfileNotFoundError for an unknown id', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const service = new UpdateProfileService(repository, eventPublisher);

    await expect(
      service.execute({ id: 'does-not-exist', patch: { bio: 'Hello' } }),
    ).rejects.toThrow(ProfileNotFoundError);
    expect(eventPublisher.published).toHaveLength(0);
  });
});
