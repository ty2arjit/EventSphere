import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const SESSION_CREATED = 'SessionCreated';
export const SESSION_UPDATED = 'SessionUpdated';
export const SESSION_STARTED = 'SessionStarted';
export const SESSION_COMPLETED = 'SessionCompleted';
export const SESSION_CANCELLED = 'SessionCancelled';

export function makeSessionEvent(eventType: string, sessionId: string, eventId: string): DomainEvent {
  return createDomainEvent({
    eventType,
    aggregateId: sessionId,
    aggregateType: 'Session',
    payload: { eventId },
  });
}
