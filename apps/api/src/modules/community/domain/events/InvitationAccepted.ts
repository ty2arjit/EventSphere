import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const INVITATION_ACCEPTED = 'InvitationAccepted';

export interface InvitationAcceptedPayload {
  communityId: string;
  invitationId: string;
  userId: string;
}

export function invitationAccepted(payload: InvitationAcceptedPayload): DomainEvent<InvitationAcceptedPayload> {
  return createDomainEvent({ eventType: INVITATION_ACCEPTED, aggregateId: payload.communityId, aggregateType: 'Community', payload });
}
