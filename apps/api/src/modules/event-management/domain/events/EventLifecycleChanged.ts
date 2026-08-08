import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const REGISTRATION_OPENED = 'RegistrationOpened';
export const REGISTRATION_CLOSED = 'RegistrationClosed';
export const EVENT_STARTED = 'EventStarted';
export const EVENT_COMPLETED = 'EventCompleted';
export const EVENT_ARCHIVED = 'EventArchived';
export const EVENT_CANCELLED = 'EventCancelled';

export function makeLifecycleEvent(eventType: string, eventId: string, from: string, to: string): DomainEvent {
  return createDomainEvent({
    eventType,
    aggregateId: eventId,
    aggregateType: 'Event',
    payload: { from, to },
  });
}
