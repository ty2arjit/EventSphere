import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const PROFILE_UPDATED = 'ProfileUpdated';

export interface ProfileUpdatedPayload {
  userId: string;
  changedFields: string[];
}

/**
 * Published after bio/headline/institution/department/graduationYear change
 * (one fact covering all of them — Constitution Article 37, these fields
 * aren't independently meaningful business events).
 */
export function profileUpdated(payload: ProfileUpdatedPayload): DomainEvent<ProfileUpdatedPayload> {
  return createDomainEvent({
    eventType: PROFILE_UPDATED,
    aggregateId: payload.userId,
    aggregateType: 'User',
    payload,
  });
}
