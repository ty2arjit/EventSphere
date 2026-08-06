import { DomainEvent, createDomainEvent } from '../../../../shared/events/DomainEvent';

export const AVATAR_CHANGED = 'AvatarChanged';

export interface AvatarChangedPayload {
  userId: string;
  avatarUrl: string | null;
}

/**
 * Published after a User's avatar changes. Kept separate from ProfileUpdated
 * because avatar is rendered across many other bounded contexts (Community,
 * Event, Registration, Certificate) — a genuinely distinct fact from bio/
 * headline/etc., unlike those which have no confirmed cross-context consumer.
 */
export function avatarChanged(payload: AvatarChangedPayload): DomainEvent<AvatarChangedPayload> {
  return createDomainEvent({
    eventType: AVATAR_CHANGED,
    aggregateId: payload.userId,
    aggregateType: 'User',
    payload,
  });
}
