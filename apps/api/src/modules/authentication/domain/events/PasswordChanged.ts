import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const PASSWORD_CHANGED = 'PasswordChanged';

export interface PasswordChangedPayload {
  userCredentialId: string;
  changedAt: string;
}

/**
 * Emitted after a password change or a completed reset. No cross-context
 * consumer required in Phase 0; future Notification Domain will want to
 * send a "your password was changed" email.
 */
export function passwordChanged(
  payload: PasswordChangedPayload,
): DomainEvent<PasswordChangedPayload> {
  return createDomainEvent({
    eventType: PASSWORD_CHANGED,
    aggregateId: payload.userCredentialId,
    aggregateType: 'UserCredential',
    payload,
  });
}
