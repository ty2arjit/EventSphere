import { describe, expect, it } from 'vitest';
import { UpdateAvatarService } from './UpdateAvatarService';
import { InMemoryProfileRepository } from '../test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from '../test-support/RecordingEventPublisher';
import { User } from '../domain/User';
import { ProfileNotFoundError } from './errors';
import { AVATAR_CHANGED } from '../domain/events/AvatarChanged';

describe('UpdateAvatarService', () => {
  it('updates the avatar and publishes AvatarChanged', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const user = User.register('a@example.com', 'A');
    await repository.save(user);
    user.pullDomainEvents(); // clear ProfileRegistered — not this test's concern

    const service = new UpdateAvatarService(repository, eventPublisher);
    const updated = await service.execute({
      id: user.id,
      avatarUrl: 'https://example.com/a.png',
    });

    expect(updated.profile.avatar.url).toBe('https://example.com/a.png');
    expect(eventPublisher.published).toHaveLength(1);
    expect(eventPublisher.published[0]?.eventType).toBe(AVATAR_CHANGED);
  });

  it('throws ProfileNotFoundError for an unknown id', async () => {
    const repository = new InMemoryProfileRepository();
    const eventPublisher = new RecordingEventPublisher();
    const service = new UpdateAvatarService(repository, eventPublisher);

    await expect(
      service.execute({ id: 'does-not-exist', avatarUrl: 'https://example.com/a.png' }),
    ).rejects.toThrow(ProfileNotFoundError);
  });
});
