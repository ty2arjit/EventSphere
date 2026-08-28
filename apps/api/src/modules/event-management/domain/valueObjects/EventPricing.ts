/**
 * Whether an event charges a registration fee, and how much.
 *
 * `amount` is in the currency's minor unit (paise for INR) and is always an
 * integer — money is never represented as a floating-point number. A free
 * event carries `isPaid: false` and a null amount; the payment flow is never
 * entered for it.
 *
 * The invariant "a paid event must have a positive amount" is only enforced
 * at publish time (see `Event.publish`), not on every edit — an organizer is
 * allowed to flip the toggle to paid and fill in the price as two separate
 * steps while the event is still a Draft.
 */
export interface EventPricing {
  isPaid: boolean;
  amount: number | null;
  currency: string;
}

export function freePricing(): EventPricing {
  return { isPaid: false, amount: null, currency: 'INR' };
}

/** True when the pricing is internally consistent enough to publish. */
export function isPricingPublishable(pricing: EventPricing): boolean {
  if (!pricing.isPaid) return true;
  return pricing.amount !== null && Number.isInteger(pricing.amount) && pricing.amount > 0;
}
