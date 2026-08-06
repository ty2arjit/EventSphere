import { ProfileRepository } from '../domain/ProfileRepository';
import { User } from '../domain/User';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { ProfileNotFoundError } from './errors';

export interface UpdateAvatarInput {
  id: string;
  avatarUrl: string | null;
}

/**
 * Application Service — exactly one use case (Constitution Article 24).
 */
export class UpdateAvatarService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: UpdateAvatarInput): Promise<User> {
    const user = await this.profileRepository.findById(input.id);
    if (!user) {
      throw new ProfileNotFoundError(input.id);
    }

    user.updateAvatar(input.avatarUrl);
    await this.profileRepository.updateProfile(user);

    for (const event of user.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }

    return user;
  }
}
