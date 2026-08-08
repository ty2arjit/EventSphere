import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const POSITION_REMOVED = 'PositionRemoved';

export interface PositionRemovedPayload {
  communityId: string;
  positionId: string;
  memberId: string;
  positionName: string;
}

export function positionRemoved(payload: PositionRemovedPayload): DomainEvent<PositionRemovedPayload> {
  return createDomainEvent({ eventType: POSITION_REMOVED, aggregateId: payload.communityId, aggregateType: 'Community', payload });
}
