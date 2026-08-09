import type { Announcement } from "../domain/Announcement";
import type { AnnouncementRepository } from "../domain/AnnouncementRepository";

export class InMemoryAnnouncementRepository implements AnnouncementRepository {
  private readonly store = new Map<string, Announcement>();

  async findById(id: string): Promise<Announcement | null> {
    return this.store.get(id) ?? null;
  }

  async findByCommunityId(communityId: string): Promise<Announcement[]> {
    return [...this.store.values()].filter((a) => a.communityId === communityId);
  }

  async findByEventId(eventId: string): Promise<Announcement[]> {
    return [...this.store.values()].filter((a) => a.eventId === eventId);
  }

  async save(announcement: Announcement): Promise<void> {
    this.store.set(announcement.id, announcement);
  }

  async update(announcement: Announcement): Promise<void> {
    this.store.set(announcement.id, announcement);
  }

  async delete(id: string): Promise<void> {
    this.store.delete(id);
  }
}
