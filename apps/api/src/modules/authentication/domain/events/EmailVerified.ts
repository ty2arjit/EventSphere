import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const EMAIL_VERIFIED = 'EmailVerified';

export interface EmailVerifiedPayload {
  userCredentialId: string;
  verifiedAt: string;
}

/**
 * Primary cross-context integration point. Profile Domain subscribes and
 * calls its own VerifyIdentityService — Authentication owns credential-
 * side verification state; Profile owns User.verifiedAt (Ch.19
 * "Verified Identity" invariant). See:
 *   apps/api/src/modules/authentication/application/subscribers/
 *   verifyProfileOnEmailVerified.ts
 */
export function emailVerified(
  payload: EmailVerifiedPayload,
): DomainEvent<EmailVerifiedPayload> {
  return createDomainEvent({
    eventType: EMAIL_VERIFIED,
    aggregateId: payload.userCredentialId,
    aggregateType: 'UserCredential',
    payload,
  });
}
