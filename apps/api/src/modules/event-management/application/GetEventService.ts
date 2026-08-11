import { Event } from '../domain/Event';
import { EventRepository, EventBrowseItem } from '../domain/EventRepository';
import { EventNotFoundError } from '../domain/errors';

export class GetEventService {
  constructor(private readonly repository: EventRepository) {}

  async byId(id: string): Promise<Event> {
    const event = await this.repository.findById(id);
    if (!event) throw new EventNotFoundError(id);
    return event;
  }

  async bySlug(slug: string): Promise<Event> {
    const event = await this.repository.findBySlug(slug);
    if (!event) throw new EventNotFoundError(slug);
    return event;
  }

  async byCommunity(communityId: string): Promise<Event[]> {
    return this.repository.findByCommunityId(communityId);
  }

  async browse(
    query: string | null,
    page: number,
    pageSize: number,
  ): Promise<{ items: EventBrowseItem[]; total: number }> {
    const limit = Math.min(Math.max(pageSize, 1), 50);
    const offset = Math.max(page, 0) * limit;
    return this.repository.search(query, limit, offset);
  }
}
