import { Event } from './Event';

export interface EventRepository {
  findById(id: string): Promise<Event | null>;
  findBySlug(slug: string): Promise<Event | null>;
  findByCommunityId(communityId: string): Promise<Event[]>;
  save(event: Event): Promise<void>;
  update(event: Event): Promise<void>;
}
