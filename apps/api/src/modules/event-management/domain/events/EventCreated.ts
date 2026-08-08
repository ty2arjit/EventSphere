import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const EVENT_CREATED = 'EventCreated';

export function makeEventCreated(eventId: string, communityId: string, name: string): DomainEvent {
  return createDomainEvent({
    eventType: EVENT_CREATED,
    aggregateId: eventId,
    aggregateType: 'Event',
    payload: { communityId, name },
  });
}
