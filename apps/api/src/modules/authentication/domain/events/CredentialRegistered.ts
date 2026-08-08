import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const CREDENTIAL_REGISTERED = 'CredentialRegistered';

export interface CredentialRegisteredPayload {
  userCredentialId: string;
  email: string;
}

/**
 * Published after a new UserCredential is persisted. No cross-context
 * consumer required in Phase 0 — retained for audit-log purposes.
 */
export function credentialRegistered(
  payload: CredentialRegisteredPayload,
): DomainEvent<CredentialRegisteredPayload> {
  return createDomainEvent({
    eventType: CREDENTIAL_REGISTERED,
    aggregateId: payload.userCredentialId,
    aggregateType: 'UserCredential',
    payload,
  });
}
