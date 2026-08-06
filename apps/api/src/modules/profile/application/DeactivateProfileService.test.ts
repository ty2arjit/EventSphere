import { describe, expect, it } from 'vitest';
import { DeactivateProfileService } from './DeactivateProfileService';
import { InMemoryProfileRepository } from '../test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from '../test-support/RecordingEventPublisher';
import { User } from '../domain/User';
import { ProfileNotFoundError } from './errors';
import { InvalidLifecycleTransitionError } from '../domain/errors';
import { PROFILE_DEACTIVATED } from '../domain/events/ProfileDeactivated';

describe('DeactivateProfileService', () => {
  it('deactivates an active profile and publishes ProfileDeactivated', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const user = User.register('a@example.com', 'A');
    user.verifyIdentity();
    user.activate();
    await repository.save(user);
    user.pullDomainEvents(); // clear ProfileRegistered/ProfileVerified — not this test's concern

    const service = new DeactivateProfileService(repository, eventPublisher);
    const deactivated = await service.execute(user.id);

    expect(deactivated.status).toBe('inactive');
    expect(eventPublisher.published).toHaveLength(1);
    expect(eventPublisher.published[0]?.eventType).toBe(PROFILE_DEACTIVATED);
  });

  it('propagates InvalidLifecycleTransitionError when not active', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const user = User.register('a@example.com', 'A'); // still 'registered'
    await repository.save(user);

    const service = new DeactivateProfileService(repository, eventPublisher);
    await expect(service.execute(user.id)).rejects.toThrow(InvalidLifecycleTransitionError);
  });

  it('throws ProfileNotFoundError for an unknown id', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const service = new DeactivateProfileService(repository, eventPublisher);

    await expect(service.execute('does-not-exist')).rejects.toThrow(ProfileNotFoundError);
  });
});
