import { EventRepository } from '../../event-management/domain/EventRepository';
import { EventNotFoundError } from '../../event-management/domain/errors';

/**
 * Shared lookup used by every downstream context resolver that only has an
 * eventId to work with (Committee, Participation, Volunteer, event-scoped
 * Announcements) — none of those aggregates store communityId directly.
 */
export async function resolveEventCommunityId(
  eventRepository: EventRepository,
  eventId: string,
): Promise<string> {
  const event = await eventRepository.findById(eventId);
  if (!event) throw new EventNotFoundError(eventId);
  return event.communityId;
}
