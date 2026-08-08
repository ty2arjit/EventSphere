import { EventRepository } from '../domain/EventRepository';
import { EventNotFoundError } from '../domain/errors';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { TimeSlot } from '../domain/valueObjects/TimeSlot';

export class ManageSessionService {
  constructor(
    private readonly repository: EventRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async addSession(eventId: string, title: string, description: string | null): Promise<{ sessionId: string }> {
    const event = await this.repository.findById(eventId);
    if (!event) throw new EventNotFoundError(eventId);

    const session = event.addSession(title, description);
    await this.repository.update(event);
    for (const domainEvent of event.pullDomainEvents()) {
      await this.eventPublisher.publish(domainEvent);
    }
    return { sessionId: session.id };
  }

  async updateSession(eventId: string, sessionId: string, fields: {
    title?: string;
    description?: string | null;
    speaker?: string | null;
    room?: string | null;
  }): Promise<void> {
    const event = await this.repository.findById(eventId);
    if (!event) throw new EventNotFoundError(eventId);

    const session = event.getSession(sessionId);
    session.update(fields);
    await this.repository.update(event);
  }

  async scheduleSession(eventId: string, sessionId: string, slot: TimeSlot): Promise<void> {
    const event = await this.repository.findById(eventId);
    if (!event) throw new EventNotFoundError(eventId);

    const session = event.getSession(sessionId);
    session.schedule(slot);
    await this.repository.update(event);
  }

  async startSession(eventId: string, sessionId: string): Promise<void> {
    const event = await this.repository.findById(eventId);
    if (!event) throw new EventNotFoundError(eventId);

    event.startSession(sessionId);
    await this.repository.update(event);
    for (const domainEvent of event.pullDomainEvents()) {
      await this.eventPublisher.publish(domainEvent);
    }
  }

  async completeSession(eventId: string, sessionId: string): Promise<void> {
    const event = await this.repository.findById(eventId);
    if (!event) throw new EventNotFoundError(eventId);

    event.getSession(sessionId).complete();
    await this.repository.update(event);
  }

  async cancelSession(eventId: string, sessionId: string): Promise<void> {
    const event = await this.repository.findById(eventId);
    if (!event) throw new EventNotFoundError(eventId);

    event.getSession(sessionId).cancel();
    await this.repository.update(event);
  }
}
