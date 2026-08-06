import { ProfileRepository } from '../domain/ProfileRepository';
import { User } from '../domain/User';
import { ProfileNotFoundError } from './errors';

/**
 * Application Service — exactly one use case (Constitution Article 24).
 */
export class GetProfileService {
  constructor(private readonly profileRepository: ProfileRepository) {}

  async execute(id: string): Promise<User> {
    const user = await this.profileRepository.findById(id);
    if (!user) {
      throw new ProfileNotFoundError(id);
    }
    return user;
  }
}
