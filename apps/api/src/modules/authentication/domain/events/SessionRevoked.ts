import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const SESSION_REVOKED = 'SessionRevoked';

export type SessionRevocationReason =
  | 'logout'
  | 'logout_everywhere'
  | 'password_changed'
  | 'password_reset'
  | 'refresh_token_reuse_detected';

export interface SessionRevokedPayload {
  userCredentialId: string;
  sessionId: string;
  reason: SessionRevocationReason;
  occurredAt: string;
}

export function sessionRevoked(
  payload: SessionRevokedPayload,
): DomainEvent<SessionRevokedPayload> {
  return createDomainEvent({
    eventType: SESSION_REVOKED,
    aggregateId: payload.userCredentialId,
    aggregateType: 'UserCredential',
    payload,
  });
}
