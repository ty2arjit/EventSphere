import { ProfileRepository } from '../domain/ProfileRepository';
import { User } from '../domain/User';
import { ProfilePatch } from '../domain/entities/UserProfile';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { ProfileNotFoundError } from './errors';

export interface UpdateProfileInput {
  id: string;
  patch: ProfilePatch;
}

/**
 * Application Service — exactly one use case (Constitution Article 24).
 * Orchestrates the repository, the aggregate, and event publication; makes
 * no business-rule decisions of its own (Article 14).
 */
export class UpdateProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: UpdateProfileInput): Promise<User> {
    const user = await this.profileRepository.findById(input.id);
    if (!user) {
      throw new ProfileNotFoundError(input.id);
    }

    user.updateProfile(input.patch);
    await this.profileRepository.updateProfile(user);

    for (const event of user.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }

    return user;
  }
}
