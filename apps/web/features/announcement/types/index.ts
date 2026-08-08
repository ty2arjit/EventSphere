export interface AnnouncementResponse {
  id: string;
  communityId: string | null;
  eventId: string | null;
  authorId: string;
  title: string;
  body: string;
  priority: string;
  channels: string[];
  publishedAt: string | null;
  expiresAt: string | null;
  isDraft: boolean;
  createdAt: string;
}

export interface CreateAnnouncementInput {
  title: string;
  body: string;
  priority?: string;
  channels?: string[];
  communityId?: string;
  eventId?: string;
}
