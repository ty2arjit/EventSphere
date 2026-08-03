import { DomainEvent } from '../../../shared/events/DomainEvent';
import { EventPublisher, EventSubscriber } from '../../../shared/events/EventPublisher';

/**
 * Test double capturing published events so tests can assert on them without
 * running real subscribers.
 */
export class RecordingEventPublisher implements EventPublisher {
  readonly published: DomainEvent[] = [];

  async publish(event: DomainEvent): Promise<void> {
    this.published.push(event);
  }

  subscribe(_eventType: string, _subscriber: EventSubscriber): void {
    // No-op: tests assert on `published` rather than on subscriber side effects.
  }
}
