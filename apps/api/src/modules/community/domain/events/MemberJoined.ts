import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const MEMBER_JOINED = 'MemberJoined';

export interface MemberJoinedPayload {
  communityId: string;
  userId: string;
  memberId: string;
}

export function memberJoined(payload: MemberJoinedPayload): DomainEvent<MemberJoinedPayload> {
  return createDomainEvent({ eventType: MEMBER_JOINED, aggregateId: payload.communityId, aggregateType: 'Community', payload });
}
