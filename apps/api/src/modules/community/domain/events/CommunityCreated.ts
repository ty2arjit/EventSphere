import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const COMMUNITY_CREATED = 'CommunityCreated';

export interface CommunityCreatedPayload {
  communityId: string;
  name: string;
  ownerId: string;
}

export function communityCreated(payload: CommunityCreatedPayload): DomainEvent<CommunityCreatedPayload> {
  return createDomainEvent({ eventType: COMMUNITY_CREATED, aggregateId: payload.communityId, aggregateType: 'Community', payload });
}
