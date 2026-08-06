import { ProfileRepository } from '../domain/ProfileRepository';
import { User } from '../domain/User';
import { PreferencesPatch } from '../domain/entities/UserPreferences';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { ProfileNotFoundError } from './errors';

export interface UpdatePreferencesInput {
  id: string;
  patch: PreferencesPatch;
}

/**
 * Application Service — exactly one use case (Constitution Article 24).
 */
export class UpdatePreferencesService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: UpdatePreferencesInput): Promise<User> {
    const user = await this.profileRepository.findById(input.id);
    if (!user) {
      throw new ProfileNotFoundError(input.id);
    }

    user.updatePreferences(input.patch);
    await this.profileRepository.updatePreferences(user);

    for (const event of user.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }

    return user;
  }
}
