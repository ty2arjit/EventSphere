import type { Announcement } from "./Announcement";

export interface AnnouncementRepository {
  findById(id: string): Promise<Announcement | null>;
  findByCommunityId(communityId: string): Promise<Announcement[]>;
  findByEventId(eventId: string): Promise<Announcement[]>;
  save(announcement: Announcement): Promise<void>;
  update(announcement: Announcement): Promise<void>;
  delete(id: string): Promise<void>;
}
