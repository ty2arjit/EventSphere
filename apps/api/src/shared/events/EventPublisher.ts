import { DomainEvent } from './DomainEvent';

export type EventSubscriber = (event: DomainEvent) => void | Promise<void>;

/**
 * Publisher interface — depended upon by Application Services. Declared as an
 * abstraction so the Application layer never binds to a concrete transport
 * (Constitution Article 11: dependencies point inward).
 *
 * Ch.42 "Stage 1 — Modular Monolith" explicitly expects in-process delivery
 * at this stage; Kafka/RabbitMQ arrive only if and when a bounded context is
 * extracted into its own service. Swapping implementations then requires no
 * change to any business domain.
 */
export interface EventPublisher {
  publish(event: DomainEvent): Promise<void>;
  subscribe(eventType: string, subscriber: EventSubscriber): void;
}

export class InProcessEventPublisher implements EventPublisher {
  private readonly subscribers = new Map<string, EventSubscriber[]>();

  subscribe(eventType: string, subscriber: EventSubscriber): void {
    const existing = this.subscribers.get(eventType) ?? [];
    existing.push(subscriber);
    this.subscribers.set(eventType, existing);
  }

  /**
   * Subscriber failures are isolated: one failing subscriber must never
   * invalidate the originating business transaction, nor prevent other
   * subscribers from running (Constitution Part II — Failure Isolation).
   * Failures are logged by the caller-supplied onSubscriberError hook.
   */
  async publish(event: DomainEvent): Promise<void> {
    const subscribers = this.subscribers.get(event.eventType) ?? [];

    for (const subscriber of subscribers) {
      try {
        await subscriber(event);
      } catch (error) {
        this.onSubscriberError(event, error);
      }
    }
  }

  constructor(
    private readonly onSubscriberError: (event: DomainEvent, error: unknown) => void = () => {},
  ) {}
}
