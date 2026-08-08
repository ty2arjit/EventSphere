import { randomUUID } from "node:crypto";

export type AnnouncementPriority = "Low" | "Normal" | "High" | "Urgent";
export type AnnouncementChannel = "InApp" | "Email" | "Push";

export interface AnnouncementProps {
  id: string;
  communityId: string | null;
  eventId: string | null;
  authorId: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  channels: AnnouncementChannel[];
  publishedAt: Date | null;
  expiresAt: Date | null;
  isDraft: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class Announcement {
  readonly id: string;
  communityId: string | null;
  eventId: string | null;
  readonly authorId: string;
  title: string;
  body: string;
  priority: AnnouncementPriority;
  channels: AnnouncementChannel[];
  publishedAt: Date | null;
  expiresAt: Date | null;
  isDraft: boolean;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: AnnouncementProps) {
    this.id = props.id;
    this.communityId = props.communityId;
    this.eventId = props.eventId;
    this.authorId = props.authorId;
    this.title = props.title;
    this.body = props.body;
    this.priority = props.priority;
    this.channels = props.channels;
    this.publishedAt = props.publishedAt;
    this.expiresAt = props.expiresAt;
    this.isDraft = props.isDraft;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    authorId: string,
    title: string,
    body: string,
    options: {
      communityId?: string | null;
      eventId?: string | null;
      priority?: AnnouncementPriority;
      channels?: AnnouncementChannel[];
    } = {},
  ): Announcement {
    return new Announcement({
      id: randomUUID(),
      communityId: options.communityId ?? null,
      eventId: options.eventId ?? null,
      authorId,
      title,
      body,
      priority: options.priority ?? "Normal",
      channels: options.channels ?? ["InApp"],
      publishedAt: null,
      expiresAt: null,
      isDraft: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  publish(): void {
    if (!this.isDraft) throw new Error("Announcement is already published");
    this.isDraft = false;
    this.publishedAt = new Date();
    this.updatedAt = new Date();
  }

  unpublish(): void {
    if (this.isDraft) throw new Error("Announcement is already a draft");
    this.isDraft = true;
    this.publishedAt = null;
    this.updatedAt = new Date();
  }

  update(title: string, body: string, priority: AnnouncementPriority): void {
    this.title = title;
    this.body = body;
    this.priority = priority;
    this.updatedAt = new Date();
  }

  setExpiry(expiresAt: Date | null): void {
    this.expiresAt = expiresAt;
    this.updatedAt = new Date();
  }

  get isExpired(): boolean {
    return this.expiresAt !== null && new Date() > this.expiresAt;
  }
}
