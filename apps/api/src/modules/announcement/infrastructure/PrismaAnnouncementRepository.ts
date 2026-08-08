import type { PrismaClient } from "@prisma/client";
import type { AnnouncementRepository } from "../domain/AnnouncementRepository";
import { Announcement, type AnnouncementPriority, type AnnouncementChannel } from "../domain/Announcement";

function toDomain(row: {
  id: string;
  communityId: string | null;
  eventId: string | null;
  authorId: string;
  title: string;
  body: string;
  priority: string;
  channels: unknown;
  publishedAt: Date | null;
  expiresAt: Date | null;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}): Announcement {
  return new Announcement({
    id: row.id,
    communityId: row.communityId,
    eventId: row.eventId,
    authorId: row.authorId,
    title: row.title,
    body: row.body,
    priority: row.priority as AnnouncementPriority,
    channels: (row.channels as AnnouncementChannel[]) ?? [],
    publishedAt: row.publishedAt,
    expiresAt: row.expiresAt,
    isDraft: row.isDraft,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class PrismaAnnouncementRepository implements AnnouncementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string) {
    const row = await this.prisma.announcement.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByCommunityId(communityId: string) {
    const rows = await this.prisma.announcement.findMany({ where: { communityId }, orderBy: { createdAt: "desc" } });
    return rows.map(toDomain);
  }

  async findByEventId(eventId: string) {
    const rows = await this.prisma.announcement.findMany({ where: { eventId }, orderBy: { createdAt: "desc" } });
    return rows.map(toDomain);
  }

  async save(a: Announcement) {
    await this.prisma.announcement.create({
      data: {
        id: a.id,
        communityId: a.communityId,
        eventId: a.eventId,
        authorId: a.authorId,
        title: a.title,
        body: a.body,
        priority: a.priority,
        channels: a.channels,
        publishedAt: a.publishedAt,
        expiresAt: a.expiresAt,
        isDraft: a.isDraft,
      },
    });
  }

  async update(a: Announcement) {
    await this.prisma.announcement.update({
      where: { id: a.id },
      data: {
        title: a.title,
        body: a.body,
        priority: a.priority,
        channels: a.channels,
        publishedAt: a.publishedAt,
        expiresAt: a.expiresAt,
        isDraft: a.isDraft,
        updatedAt: a.updatedAt,
      },
    });
  }

  async delete(id: string) {
    await this.prisma.announcement.delete({ where: { id } });
  }
}
