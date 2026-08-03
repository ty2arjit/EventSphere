import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const PROFILE_REGISTERED = 'ProfileRegistered';

export interface ProfileRegisteredPayload {
  userId: string;
  email: string;
  name: string;
}

/**
 * Published after a User has been successfully registered AND persisted.
 * Past tense: it records a fact, never requests an action (Article 17).
 */
export function profileRegistered(
  payload: ProfileRegisteredPayload,
): DomainEvent<ProfileRegisteredPayload> {
  return createDomainEvent({
    eventType: PROFILE_REGISTERED,
    aggregateId: payload.userId,
    aggregateType: 'User',
    payload,
  });
}
