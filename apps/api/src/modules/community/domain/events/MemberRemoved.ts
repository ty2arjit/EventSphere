import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const MEMBER_REMOVED = 'MemberRemoved';

export interface MemberRemovedPayload {
  communityId: string;
  userId: string;
  memberId: string;
}

export function memberRemoved(payload: MemberRemovedPayload): DomainEvent<MemberRemovedPayload> {
  return createDomainEvent({ eventType: MEMBER_REMOVED, aggregateId: payload.communityId, aggregateType: 'Community', payload });
}
