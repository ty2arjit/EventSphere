import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const SESSION_STARTED = 'SessionStarted';

export interface SessionStartedPayload {
  userCredentialId: string;
  sessionId: string;
  deviceLabel: string | null;
  occurredAt: string;
}

export function sessionStarted(
  payload: SessionStartedPayload,
): DomainEvent<SessionStartedPayload> {
  return createDomainEvent({
    eventType: SESSION_STARTED,
    aggregateId: payload.userCredentialId,
    aggregateType: 'UserCredential',
    payload,
  });
}
