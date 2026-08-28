import type { EventPricingReader, EventPricingView } from '../application/EventPricingReader';

export class StubEventPricingReader implements EventPricingReader {
  private readonly byId = new Map<string, EventPricingView>();

  set(eventId: string, pricing: Omit<EventPricingView, 'eventId'>): void {
    this.byId.set(eventId, { eventId, ...pricing });
  }

  async getPricing(eventId: string): Promise<EventPricingView | null> {
    return this.byId.get(eventId) ?? null;
  }
}
