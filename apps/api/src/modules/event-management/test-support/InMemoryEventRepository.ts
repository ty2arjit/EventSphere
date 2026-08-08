import { EventRepository } from '../domain/EventRepository';
import { Event } from '../domain/Event';

export class InMemoryEventRepository implements EventRepository {
  private events = new Map<string, Event>();

  async findById(id: string): Promise<Event | null> {
    return this.events.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Event | null> {
    for (const event of this.events.values()) {
      if (event.slug === slug) return event;
    }
    return null;
  }

  async findByCommunityId(communityId: string): Promise<Event[]> {
    return Array.from(this.events.values()).filter((e) => e.communityId === communityId);
  }

  async save(event: Event): Promise<void> {
    this.events.set(event.id, event);
  }

  async update(event: Event): Promise<void> {
    this.events.set(event.id, event);
  }
}
