import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const PROFILE_DEACTIVATED = 'ProfileDeactivated';

export interface ProfileDeactivatedPayload {
  userId: string;
  deactivatedAt: string;
}

/**
 * Published after a User is soft-deactivated (Ch.19 "Soft Deletion"
 * invariant — deactivate, never hard-delete). Contexts that reference User
 * (Community, Event, Registration, Attendance) may want to react rather than
 * re-query status on every render.
 */
export function profileDeactivated(
  payload: ProfileDeactivatedPayload,
): DomainEvent<ProfileDeactivatedPayload> {
  return createDomainEvent({
    eventType: PROFILE_DEACTIVATED,
    aggregateId: payload.userId,
    aggregateType: 'User',
    payload,
  });
}
