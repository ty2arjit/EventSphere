import { Event } from '../../domain/Event';
import { EventBrowseItem } from '../../domain/EventRepository';
import { EventResponseDto, EventListItemDto, EventBrowseItemDto, SessionResponseDto } from '../dto/EventResponseDto';

export function toEventResponse(event: Event): EventResponseDto {
  return {
    id: event.id,
    communityId: event.communityId,
    name: event.name,
    slug: event.slug,
    description: event.description,
    bannerUrl: event.bannerUrl,
    category: event.category,
    tags: event.tags as string[],
    mode: event.mode,
    visibility: event.visibility,
    location: event.location,
    capacity: event.capacity,
    startDate: event.startDate?.toISOString() ?? null,
    endDate: event.endDate?.toISOString() ?? null,
    state: event.state,
    settings: event.settings.toJSON(),
    sessions: event.sessions.map(toSessionResponse),
    createdAt: event.createdAt.toISOString(),
    updatedAt: event.updatedAt.toISOString(),
  };
}

function toSessionResponse(s: { id: string; title: string; description: string | null; speaker: string | null; room: string | null; startAt: Date | null; endAt: Date | null; state: string }): SessionResponseDto {
  return {
    id: s.id,
    title: s.title,
    description: s.description,
    speaker: s.speaker,
    room: s.room,
    startAt: s.startAt?.toISOString() ?? null,
    endAt: s.endAt?.toISOString() ?? null,
    state: s.state,
  };
}

export function toEventListItem(event: Event): EventListItemDto {
  return {
    id: event.id,
    name: event.name,
    slug: event.slug,
    description: event.description,
    bannerUrl: event.bannerUrl,
    mode: event.mode,
    state: event.state,
    startDate: event.startDate?.toISOString() ?? null,
    sessionCount: event.sessions.length,
    createdAt: event.createdAt.toISOString(),
  };
}

export function toEventBrowseItem(item: EventBrowseItem): EventBrowseItemDto {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    description: item.description,
    bannerUrl: item.bannerUrl,
    mode: item.mode,
    state: item.state,
    startDate: item.startDate?.toISOString() ?? null,
    city: item.city,
    venue: item.venue,
    communityId: item.communityId,
    communityName: item.communityName,
    communitySlug: item.communitySlug,
  };
}
