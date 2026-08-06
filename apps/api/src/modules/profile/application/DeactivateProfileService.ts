import { ProfileRepository } from '../domain/ProfileRepository';
import { User } from '../domain/User';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { ProfileNotFoundError } from './errors';

/**
 * Application Service — exactly one use case (Constitution Article 24).
 */
export class DeactivateProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(id: string): Promise<User> {
    const user = await this.profileRepository.findById(id);
    if (!user) {
      throw new ProfileNotFoundError(id);
    }

    user.deactivate();
    await this.profileRepository.updateIdentity(user);

    for (const event of user.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }

    return user;
  }
}
