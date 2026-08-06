import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const PREFERENCES_UPDATED = 'PreferencesUpdated';

export interface PreferencesUpdatedPayload {
  userId: string;
  changedFields: string[];
}

/**
 * Published after language/timezone/theme/notification preferences change.
 * Plausible future consumer: Notification Domain, to route notifications
 * correctly.
 */
export function preferencesUpdated(
  payload: PreferencesUpdatedPayload,
): DomainEvent<PreferencesUpdatedPayload> {
  return createDomainEvent({
    eventType: PREFERENCES_UPDATED,
    aggregateId: payload.userId,
    aggregateType: 'User',
    payload,
  });
}
