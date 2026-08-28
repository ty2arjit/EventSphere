import type { EventRepository } from '../../event-management/domain/EventRepository';
import type { EventPricingReader, EventPricingView } from '../application/EventPricingReader';

/**
 * Adapts event-management's repository to the payment context's narrow
 * pricing port. Lives in the payment context's infrastructure layer — the
 * one place allowed to reach across the context boundary — so the
 * application layer keeps depending only on `EventPricingReader`.
 */
export class EventRepositoryPricingReader implements EventPricingReader {
  constructor(private readonly events: EventRepository) {}

  async getPricing(eventId: string): Promise<EventPricingView | null> {
    const event = await this.events.findById(eventId);
    if (!event) return null;
    return {
      eventId: event.id,
      isPaid: event.pricing.isPaid,
      amount: event.pricing.amount,
      currency: event.pricing.currency,
    };
  }
}
