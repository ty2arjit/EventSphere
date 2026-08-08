import { CommunityRepository } from '../domain/CommunityRepository';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { CommunityNotFoundError } from '../domain/errors';

export class JoinCommunityService {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(communityId: string, userId: string): Promise<void> {
    const community = await this.communityRepository.findById(communityId);
    if (!community) throw new CommunityNotFoundError(communityId);

    community.addMember(userId);
    await this.communityRepository.update(community);

    for (const event of community.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
  }
}
