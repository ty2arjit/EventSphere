import { Event } from '../domain/Event';
import { EventRepository } from '../domain/EventRepository';
import { EventSlugTakenError } from '../domain/errors';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { EventMode } from '../domain/valueObjects/EventMode';
import { EventVisibility } from '../domain/valueObjects/EventVisibility';

export interface CreateEventInput {
  communityId: string;
  name: string;
  slug: string;
  description?: string | null;
  mode?: EventMode;
  visibility?: EventVisibility;
}

export class CreateEventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: CreateEventInput): Promise<Event> {
    const existing = await this.repository.findBySlug(input.slug);
    if (existing) throw new EventSlugTakenError(input.slug);

    const event = Event.create(input);
    await this.repository.save(event);
    for (const domainEvent of event.pullDomainEvents()) {
      await this.eventPublisher.publish(domainEvent);
    }
    return event;
  }
}
