import { PrismaClient } from '@prisma/client';
import { EventRepository } from '../domain/EventRepository';
import { Event, EventProps } from '../domain/Event';
import { Session } from '../domain/entities/Session';
import { EventSettings } from '../domain/entities/EventSettings';
import { EventLifecycleState } from '../domain/valueObjects/EventLifecycleState';
import { EventMode } from '../domain/valueObjects/EventMode';
import { EventVisibility } from '../domain/valueObjects/EventVisibility';
import { SessionLifecycleState } from '../domain/valueObjects/SessionLifecycleState';

export class PrismaEventRepository implements EventRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Event | null> {
    const row = await this.prisma.event.findUnique({
      where: { id },
      include: { sessions: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Event | null> {
    const row = await this.prisma.event.findUnique({
      where: { slug },
      include: { sessions: true },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByCommunityId(communityId: string): Promise<Event[]> {
    const rows = await this.prisma.event.findMany({
      where: { communityId },
      include: { sessions: true },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => this.toDomain(r));
  }

  async save(event: Event): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.event.create({
        data: {
          id: event.id,
          communityId: event.communityId,
          name: event.name,
          slug: event.slug,
          description: event.description,
          category: event.category,
          tags: event.tags as string[],
          mode: event.mode,
          visibility: event.visibility,
          venueLocation: event.location.venue,
          address: event.location.address,
          city: event.location.city,
          onlineUrl: event.location.onlineUrl,
          capacityMin: event.capacity.min,
          capacityMax: event.capacity.max,
          startDate: event.startDate,
          endDate: event.endDate,
          state: event.state,
          requireApproval: event.settings.requireApproval,
          allowWaitlist: event.settings.allowWaitlist,
          showAttendeeList: event.settings.showAttendeeList,
          allowGuestRegistration: event.settings.allowGuestRegistration,
        },
      });

      for (const session of event.sessions) {
        await tx.eventSession.create({
          data: {
            id: session.id,
            eventId: event.id,
            title: session.title,
            description: session.description,
            speaker: session.speaker,
            room: session.room,
            startAt: session.startAt,
            endAt: session.endAt,
            state: session.state,
          },
        });
      }
    });
  }

  async update(event: Event): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.event.update({
        where: { id: event.id },
        data: {
          name: event.name,
          description: event.description,
          category: event.category,
          tags: event.tags as string[],
          mode: event.mode,
          visibility: event.visibility,
          venueLocation: event.location.venue,
          address: event.location.address,
          city: event.location.city,
          onlineUrl: event.location.onlineUrl,
          capacityMin: event.capacity.min,
          capacityMax: event.capacity.max,
          startDate: event.startDate,
          endDate: event.endDate,
          state: event.state,
          requireApproval: event.settings.requireApproval,
          allowWaitlist: event.settings.allowWaitlist,
          showAttendeeList: event.settings.showAttendeeList,
          allowGuestRegistration: event.settings.allowGuestRegistration,
        },
      });

      for (const session of event.sessions) {
        await tx.eventSession.upsert({
          where: { id: session.id },
          create: {
            id: session.id,
            eventId: event.id,
            title: session.title,
            description: session.description,
            speaker: session.speaker,
            room: session.room,
            startAt: session.startAt,
            endAt: session.endAt,
            state: session.state,
          },
          update: {
            title: session.title,
            description: session.description,
            speaker: session.speaker,
            room: session.room,
            startAt: session.startAt,
            endAt: session.endAt,
            state: session.state,
          },
        });
      }
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(row: any): Event {
    const props: EventProps = {
      id: row.id,
      communityId: row.communityId,
      name: row.name,
      slug: row.slug,
      description: row.description,
      category: row.category,
      tags: row.tags ?? [],
      mode: row.mode as EventMode,
      visibility: row.visibility as EventVisibility,
      location: {
        venue: row.venueLocation,
        address: row.address,
        city: row.city,
        onlineUrl: row.onlineUrl,
      },
      capacity: { min: row.capacityMin, max: row.capacityMax },
      startDate: row.startDate,
      endDate: row.endDate,
      state: row.state as EventLifecycleState,
      settings: EventSettings.fromPersistence({
        requireApproval: row.requireApproval,
        allowWaitlist: row.allowWaitlist,
        showAttendeeList: row.showAttendeeList,
        allowGuestRegistration: row.allowGuestRegistration,
      }),
      sessions: (row.sessions ?? []).map((s: any) =>
        Session.fromPersistence({
          id: s.id,
          eventId: s.eventId,
          title: s.title,
          description: s.description,
          speaker: s.speaker,
          room: s.room,
          startAt: s.startAt,
          endAt: s.endAt,
          state: s.state as SessionLifecycleState,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        }),
      ),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
    return Event.fromPersistence(props);
  }
}
