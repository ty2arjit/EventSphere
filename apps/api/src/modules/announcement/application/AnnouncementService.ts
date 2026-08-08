import type { AnnouncementRepository } from "../domain/AnnouncementRepository";
import type { EventPublisher } from "../../../shared/events/EventPublisher";
import { Announcement, type AnnouncementPriority, type AnnouncementChannel } from "../domain/Announcement";
import { createDomainEvent } from "../../../shared/events/DomainEvent";
import { AnnouncementNotFoundError } from "../domain/errors";

export class AnnouncementService {
  constructor(
    private readonly repo: AnnouncementRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async create(
    authorId: string,
    title: string,
    body: string,
    options: {
      communityId?: string | null;
      eventId?: string | null;
      priority?: AnnouncementPriority;
      channels?: AnnouncementChannel[];
    } = {},
  ): Promise<Announcement> {
    const announcement = Announcement.create(authorId, title, body, options);
    await this.repo.save(announcement);
    return announcement;
  }

  async publish(id: string): Promise<void> {
    const a = await this.load(id);
    a.publish();
    await this.repo.update(a);
    await this.publisher.publish(
      createDomainEvent({
        eventType: "AnnouncementPublished",
        aggregateId: a.id,
        aggregateType: "Announcement",
        payload: { communityId: a.communityId, eventId: a.eventId, title: a.title },
      }),
    );
  }

  async unpublish(id: string): Promise<void> {
    const a = await this.load(id);
    a.unpublish();
    await this.repo.update(a);
  }

  async update(id: string, title: string, body: string, priority: AnnouncementPriority): Promise<void> {
    const a = await this.load(id);
    a.update(title, body, priority);
    await this.repo.update(a);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async listByCommunity(communityId: string): Promise<Announcement[]> {
    return this.repo.findByCommunityId(communityId);
  }

  async listByEvent(eventId: string): Promise<Announcement[]> {
    return this.repo.findByEventId(eventId);
  }

  async getById(id: string): Promise<Announcement> {
    return this.load(id);
  }

  private async load(id: string): Promise<Announcement> {
    const a = await this.repo.findById(id);
    if (!a) throw new AnnouncementNotFoundError(id);
    return a;
  }
}
