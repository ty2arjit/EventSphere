import { CommunityRepository } from '../domain/CommunityRepository';
import { Community } from '../domain/Community';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { CommunitySlugTakenError } from '../domain/errors';

export interface CreateCommunityInput {
  name: string;
  slug: string;
  description: string | null;
  ownerId: string;
}

export class CreateCommunityService {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: CreateCommunityInput): Promise<Community> {
    const existing = await this.communityRepository.findBySlug(input.slug);
    if (existing) throw new CommunitySlugTakenError(input.slug);

    const community = Community.create(input);
    await this.communityRepository.save(community);

    for (const event of community.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
    return community;
  }
}
