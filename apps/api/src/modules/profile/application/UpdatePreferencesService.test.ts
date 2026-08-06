import { describe, expect, it } from 'vitest';
import { UpdatePreferencesService } from './UpdatePreferencesService';
import { InMemoryProfileRepository } from '../test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from '../test-support/RecordingEventPublisher';
import { User } from '../domain/User';
import { ProfileNotFoundError } from './errors';
import { PREFERENCES_UPDATED } from '../domain/events/PreferencesUpdated';

describe('UpdatePreferencesService', () => {
  it('updates preferences and publishes PreferencesUpdated', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const user = User.register('a@example.com', 'A');
    await repository.save(user);
    user.pullDomainEvents(); // clear ProfileRegistered — not this test's concern

    const service = new UpdatePreferencesService(repository, eventPublisher);
    const updated = await service.execute({ id: user.id, patch: { theme: 'dark' } });

    expect(updated.preferences.theme).toBe('dark');
    expect(eventPublisher.published).toHaveLength(1);
    expect(eventPublisher.published[0]?.eventType).toBe(PREFERENCES_UPDATED);
  });

  it('throws ProfileNotFoundError for an unknown id', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const service = new UpdatePreferencesService(repository, eventPublisher);

    await expect(
      service.execute({ id: 'does-not-exist', patch: { theme: 'dark' } }),
    ).rejects.toThrow(ProfileNotFoundError);
  });
});
