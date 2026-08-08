import { ProfileGateway } from '../application/ProfileGateway';
import { RegisterProfileService } from '../../profile/application/RegisterProfileService';
import { ProfileRepository } from '../../profile/domain/ProfileRepository';

/**
 * Anti-Corruption Layer between Authentication and Profile. Lives in
 * Authentication's infrastructure/ folder because Authentication owns the
 * `ProfileGateway` interface — this is Authentication's implementation
 * of it, not Profile's.
 *
 * Uses Profile's existing PUBLIC application services (RegisterProfileService)
 * and its Repository interface (findByEmail-only, read side). Never touches
 * Profile's domain internals.
 */
export class ProfileGatewayAdapter implements ProfileGateway {
  constructor(
    private readonly registerProfileService: RegisterProfileService,
    private readonly profileRepository: ProfileRepository,
  ) {}

  async createProfile(input: { email: string; name: string }): Promise<{ userId: string }> {
    const user = await this.registerProfileService.execute(input);
    return { userId: user.id };
  }

  async findUserIdByEmail(email: string): Promise<string | null> {
    const user = await this.profileRepository.findByEmail(email);
    return user ? user.id : null;
  }
}
