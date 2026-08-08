import { CommunityRepository } from '../domain/CommunityRepository';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { CommunityNotFoundError } from '../domain/errors';

export interface CreatePositionInput {
  communityId: string;
  name: string;
  description: string | null;
  allowsMultipleHolders: boolean;
}

export interface UpdatePositionInput {
  communityId: string;
  positionId: string;
  name: string;
  description: string | null;
  allowsMultipleHolders: boolean;
}

export interface AssignPositionInput {
  communityId: string;
  positionId: string;
  memberId: string;
}

export class ManagePositionService {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async createPosition(input: CreatePositionInput): Promise<void> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError(input.communityId);

    community.createPosition(input.name, input.description, input.allowsMultipleHolders);
    await this.communityRepository.update(community);

    for (const event of community.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
  }

  async updatePosition(input: UpdatePositionInput): Promise<void> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError(input.communityId);

    community.updatePosition(input.positionId, input.name, input.description, input.allowsMultipleHolders);
    await this.communityRepository.update(community);
  }

  async assignPosition(input: AssignPositionInput): Promise<void> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError(input.communityId);

    community.assignPosition(input.positionId, input.memberId);
    await this.communityRepository.update(community);

    for (const event of community.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
  }

  async removeAssignment(input: AssignPositionInput): Promise<void> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError(input.communityId);

    community.removePositionAssignment(input.positionId, input.memberId);
    await this.communityRepository.update(community);

    for (const event of community.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
  }
}
