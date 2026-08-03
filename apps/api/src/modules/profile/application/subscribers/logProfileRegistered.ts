import { DomainEvent } from '../../../../shared/events/DomainEvent';
import { ProfileRegisteredPayload } from '../../domain/events/ProfileRegistered';
import { logger } from '../../../../shared/logger';

/**
 * Minimal subscriber proving the event pipeline works end-to-end. Logging
 * only — deliberately no business behaviour, since any real reaction would
 * belong to whichever bounded context owns that capability, not to Profile.
 */
export function logProfileRegistered(event: DomainEvent): void {
  const payload = event.payload as ProfileRegisteredPayload;

  logger.info(
    {
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      correlationId: event.correlationId,
      version: event.version,
      occurredAt: event.occurredAt.toISOString(),
      userId: payload.userId,
    },
    'Domain event received: ProfileRegistered',
  );
}
