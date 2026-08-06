import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const PROFILE_VERIFIED = 'ProfileVerified';

export interface ProfileVerifiedPayload {
  userId: string;
  verifiedAt: string;
}

/**
 * Published after a User's identity is verified (Ch.19 "Verified Identity"
 * invariant). The verification action itself is expected to be triggered by
 * the Authentication Domain later; Profile Domain owns the resulting state
 * transition and fact.
 */
export function profileVerified(payload: ProfileVerifiedPayload): DomainEvent<ProfileVerifiedPayload> {
  return createDomainEvent({
    eventType: PROFILE_VERIFIED,
    aggregateId: payload.userId,
    aggregateType: 'User',
    payload,
  });
}
