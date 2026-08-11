import { Event } from './Event';

/**
 * Read-model projection for the public browse listing. Deliberately not the
 * `Event` aggregate — it carries the community's name/slug alongside it,
 * which is cross-aggregate display data a domain entity shouldn't hold.
 */
export interface EventBrowseItem {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  bannerUrl: string | null;
  mode: string;
  state: string;
  startDate: Date | null;
  city: string | null;
  venue: string | null;
  communityId: string;
  communityName: string;
  communitySlug: string;
}

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findBySlug(slug: string): Promise<Event | null>;
  findByCommunityId(communityId: string): Promise<Event[]>;
  search(query: string | null, limit: number, offset: number): Promise<{ items: EventBrowseItem[]; total: number }>;
  save(event: Event): Promise<void>;
  update(event: Event): Promise<void>;
}
