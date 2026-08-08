import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const POSITION_ASSIGNED = 'PositionAssigned';

export interface PositionAssignedPayload {
  communityId: string;
  positionId: string;
  memberId: string;
  positionName: string;
}

export function positionAssigned(payload: PositionAssignedPayload): DomainEvent<PositionAssignedPayload> {
  return createDomainEvent({ eventType: POSITION_ASSIGNED, aggregateId: payload.communityId, aggregateType: 'Community', payload });
}
