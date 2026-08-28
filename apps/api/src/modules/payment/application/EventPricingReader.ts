/**
 * Narrow read port over the event-management context — the payment context
 * only ever needs "what does this event cost?", never the whole Event
 * aggregate. Keeping the surface this small means the two contexts stay
 * decoupled (Constitution Article 12) and the payment unit tests need only a
 * one-method fake.
 */
export interface EventPricingView {
  eventId: string;
  isPaid: boolean;
  amount: number | null;
  currency: string;
}

export interface EventPricingReader {
  getPricing(eventId: string): Promise<EventPricingView | null>;
}
