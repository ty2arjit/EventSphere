import { CommunityRepository } from '../domain/CommunityRepository';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { CommunityNotFoundError, InvitationNotFoundError } from '../domain/errors';

export interface CreateInvitationInput {
  communityId: string;
  invitedEmail: string;
  invitedByUserId: string;
}

export interface AcceptInvitationInput {
  communityId: string;
  invitationId: string;
  userId: string;
}

export class InvitationService {
  constructor(
    private readonly communityRepository: CommunityRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async createInvitation(input: CreateInvitationInput): Promise<{ invitationId: string }> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError(input.communityId);

    const invitation = community.createInvitation(input.invitedEmail, input.invitedByUserId);
    await this.communityRepository.update(community);

    return { invitationId: invitation.id };
  }

  async acceptInvitation(input: AcceptInvitationInput): Promise<void> {
    const community = await this.communityRepository.findById(input.communityId);
    if (!community) throw new CommunityNotFoundError(input.communityId);

    community.acceptInvitation(input.invitationId, input.userId);
    await this.communityRepository.update(community);

    for (const event of community.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
  }
}
