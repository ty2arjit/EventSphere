import { CommunityRepository } from '../domain/CommunityRepository';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { CommunityNotFoundError } from '../domain/errors';

export class TransferOwnershipService {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(communityId: string, newOwnerId: string): Promise<void> {
    const community = await this.communityRepository.findById(communityId);
    if (!community) throw new CommunityNotFoundError(communityId);

    community.transferOwnership(newOwnerId);
    await this.communityRepository.update(community);

    for (const event of community.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
  }
}
