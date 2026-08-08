import { EventRepository } from '../domain/EventRepository';
import { EventNotFoundError } from '../domain/errors';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { EventLifecycleState } from '../domain/valueObjects/EventLifecycleState';

export class TransitionEventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(eventId: string, targetState: EventLifecycleState): Promise<void> {
    const event = await this.repository.findById(eventId);
    if (!event) throw new EventNotFoundError(eventId);

    const transitionMap: Record<string, () => void> = {
      Published: () => event.publish(),
      RegistrationOpen: () => event.openRegistration(),
      RegistrationClosed: () => event.closeRegistration(),
      Live: () => event.goLive(),
      Completed: () => event.complete(),
      Archived: () => event.archive(),
      Cancelled: () => event.cancel(),
    };

    const action = transitionMap[targetState];
    if (action) action();

    await this.repository.update(event);
    for (const domainEvent of event.pullDomainEvents()) {
      await this.eventPublisher.publish(domainEvent);
    }
  }
}
