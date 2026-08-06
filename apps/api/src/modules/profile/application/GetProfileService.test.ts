import { describe, expect, it } from 'vitest';
import { GetProfileService } from './GetProfileService';
import { InMemoryProfileRepository } from '../test-support/InMemoryProfileRepository';
import { User } from '../domain/User';
import { ProfileNotFoundError } from './errors';

describe('GetProfileService', () => {
  it('returns the User for a known id', async () => {
    const repository = new InMemoryProfileRepository();
    const user = User.register('a@example.com', 'A');
    await repository.save(user);

    const service = new GetProfileService(repository);
    const found = await service.execute(user.id);

    expect(found.id).toBe(user.id);
  });

  it('throws ProfileNotFoundError for an unknown id', async () => {
    const repository = new InMemoryProfileRepository();
    const service = new GetProfileService(repository);

    await expect(service.execute('does-not-exist')).rejects.toThrow(ProfileNotFoundError);
  });
});
