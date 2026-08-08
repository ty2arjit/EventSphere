import { Event } from '../domain/Event';
import { EventRepository } from '../domain/EventRepository';
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
}
