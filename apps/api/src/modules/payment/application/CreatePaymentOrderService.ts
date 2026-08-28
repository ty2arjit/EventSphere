import type { PaymentRepository } from '../domain/PaymentRepository';
import type { PaymentGateway } from '../domain/PaymentGateway';
import type { EventPricingReader } from './EventPricingReader';
import { Payment } from '../domain/Payment';
import {
  EventNotFoundForPaymentError,
  EventNotPaidError,
} from '../domain/errors';

export interface CreatePaymentOrderInput {
  eventId: string;
  userId: string;
  enrollmentId?: string | null;
}

export interface PaymentOrderView {
  paymentId: string;
  providerOrderId: string;
  amount: number;
  currency: string;
  /** Publishable key for the browser checkout widget. */
  keyId: string;
  status: string;
}

/**
 * Creates (or re-uses) a provider order for the registration fee.
 *
 * Idempotency / retry: there is at most one Payment row per (event, user).
 *  - already Paid  → return it unchanged, the caller shows "already paid".
 *  - still Created → return the existing order (double-click, reopened modal).
 *  - Failed        → mint a fresh provider order on the same row and retry.
 *
 * The amount is always taken from the event, never from the client — the
 * browser cannot talk us into a cheaper price.
 */
export class CreatePaymentOrderService {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly gateway: PaymentGateway,
    private readonly pricing: EventPricingReader,
  ) {}

  async execute(input: CreatePaymentOrderInput): Promise<PaymentOrderView> {
    const pricing = await this.pricing.getPricing(input.eventId);
    if (!pricing) throw new EventNotFoundForPaymentError(input.eventId);
    if (!pricing.isPaid || pricing.amount === null || pricing.amount <= 0) {
      throw new EventNotPaidError(input.eventId);
    }
    const amount = pricing.amount;
    const currency = pricing.currency;

    const existing = await this.paymentRepo.findByEventAndUser(input.eventId, input.userId);

    if (existing?.isPaid) {
      return this.toView(existing, amount, currency);
    }

    if (existing && existing.status === 'Created' && existing.amount === amount) {
      return this.toView(existing, amount, currency);
    }

    const order = await this.gateway.createOrder({
      amount,
      currency,
      receipt: existing?.id ?? 'pending',
      notes: { eventId: input.eventId, userId: input.userId },
    });

    if (existing) {
      existing.restartWithOrder(order.providerOrderId, amount);
      if (input.enrollmentId) existing.linkEnrollment(input.enrollmentId);
      await this.paymentRepo.update(existing);
      return this.toView(existing, amount, currency);
    }

    const payment = Payment.create({
      eventId: input.eventId,
      userId: input.userId,
      enrollmentId: input.enrollmentId ?? null,
      amount,
      currency,
      providerOrderId: order.providerOrderId,
    });
    await this.paymentRepo.save(payment);
    return this.toView(payment, amount, currency);
  }

  private toView(payment: Payment, amount: number, currency: string): PaymentOrderView {
    return {
      paymentId: payment.id,
      providerOrderId: payment.providerOrderId,
      amount,
      currency,
      keyId: this.gateway.publicKey,
      status: payment.status,
    };
  }
}
