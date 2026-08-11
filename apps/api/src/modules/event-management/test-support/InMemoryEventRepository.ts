import { EventRepository, EventBrowseItem } from '../domain/EventRepository';
import { Event } from '../domain/Event';
import { CommunityRepository } from '../../community/domain/CommunityRepository';

export class InMemoryEventRepository implements EventRepository {
  private events = new Map<string, Event>();

  /** Optional — lets `search()` resolve real community name/slug in tests, matching Prisma's join. */
  constructor(private readonly communityRepository?: CommunityRepository) {}

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

  async search(
    query: string | null,
    limit: number,
    offset: number,
  ): Promise<{ items: EventBrowseItem[]; total: number }> {
    const matches = Array.from(this.events.values()).filter((e) => {
      if (e.visibility !== 'Public' || e.state === 'Draft') return false;
      if (!query) return true;
      return e.name.toLowerCase().includes(query.toLowerCase());
    });
    const items: EventBrowseItem[] = await Promise.all(
      matches.slice(offset, offset + limit).map(async (e) => {
        const community = await this.communityRepository?.findById(e.communityId);
        return {
          id: e.id,
          name: e.name,
          slug: e.slug,
          description: e.description,
          bannerUrl: e.bannerUrl,
          mode: e.mode,
          state: e.state,
          startDate: e.startDate,
          city: e.location.city,
          venue: e.location.venue,
          communityId: e.communityId,
          communityName: community?.name ?? '',
          communitySlug: community?.slug ?? '',
        };
      }),
    );
    return { items, total: matches.length };
  }

  async save(event: Event): Promise<void> {
    this.events.set(event.id, event);
  }

  async update(event: Event): Promise<void> {
    this.events.set(event.id, event);
  }
}
