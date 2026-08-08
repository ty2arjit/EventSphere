import { CommunityRepository } from '../domain/CommunityRepository';
import { Community } from '../domain/Community';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { CommunityNotFoundError } from '../domain/errors';

export interface UpdateCommunityInput {
  id: string;
  patch: { name?: string; description?: string | null; logoUrl?: string | null };
}

export class UpdateCommunityService {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: UpdateCommunityInput): Promise<Community> {
    const community = await this.communityRepository.findById(input.id);
    if (!community) throw new CommunityNotFoundError(input.id);

    community.updateProfile(input.patch);
    await this.communityRepository.update(community);

    for (const event of community.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
    return community;
  }
}
