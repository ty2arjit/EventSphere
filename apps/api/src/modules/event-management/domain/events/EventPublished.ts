import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const EVENT_PUBLISHED = 'EventPublished';

export function makeEventPublished(eventId: string): DomainEvent {
  return createDomainEvent({
    eventType: EVENT_PUBLISHED,
    aggregateId: eventId,
    aggregateType: 'Event',
    payload: {},
  });
}
