import type { PaymentRepository } from '../domain/PaymentRepository';
import type { PaymentGateway } from '../domain/PaymentGateway';
import type { EventPublisher } from '../../../shared/events/EventPublisher';
import { logger } from '../../../shared/logger';
import { WebhookSignatureInvalidError } from '../domain/errors';
import { paymentSucceeded, paymentFailed } from '../domain/events/PaymentEvents';

/**
 * Server-to-server confirmation from Razorpay — the source of truth.
 *
 * We verify the HMAC of the *raw* request body (so the webhook route must be
 * mounted with a raw body parser, before express.json), then act only on the
 * events we care about:
 *   - payment.captured / order.paid → mark Paid, publish PaymentSucceeded
 *   - payment.failed                → mark Failed, publish PaymentFailed
 *
 * Everything is idempotent and keyed on the provider order id, because
 * Razorpay retries webhooks and the browser verify call may have already
 * settled the same payment.
 *
 * Always resolves (never throws) for a *validly signed* webhook, even for
 * event types we ignore — Razorpay treats a non-2xx as "retry forever".
 */
export class HandleRazorpayWebhookService {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly gateway: PaymentGateway,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(rawBody: Buffer | string, signature: string): Promise<void> {
    if (!this.gateway.verifyWebhookSignature(rawBody, signature)) {
      throw new WebhookSignatureInvalidError();
    }

    const body = JSON.parse(rawBody.toString());
    const eventType: string = body.event;
    const entity =
      body.payload?.payment?.entity ?? body.payload?.order?.entity ?? {};
    const providerOrderId: string | undefined = entity.order_id ?? entity.id;
    const providerPaymentId: string | undefined = entity.id;

    if (!providerOrderId) {
      logger.warn({ eventType }, 'Razorpay webhook with no resolvable order id — ignoring');
      return;
    }

    const payment = await this.paymentRepo.findByProviderOrderId(providerOrderId);
    if (!payment) {
      logger.warn({ eventType, providerOrderId }, 'Razorpay webhook for unknown order — ignoring');
      return;
    }

    if (eventType === 'payment.captured' || eventType === 'order.paid') {
      if (payment.isPaid) return;
      payment.markPaid(providerPaymentId ?? `${providerOrderId}:captured`);
      await this.paymentRepo.update(payment);
      await this.publisher.publish(
        paymentSucceeded({
          paymentId: payment.id,
          eventId: payment.eventId,
          userId: payment.userId,
          enrollmentId: payment.enrollmentId,
          amount: payment.amount,
          currency: payment.currency,
        }),
      );
      return;
    }

    if (eventType === 'payment.failed') {
      if (payment.status === 'Paid' || payment.status === 'Refunded') return;
      payment.markFailed();
      await this.paymentRepo.update(payment);
      await this.publisher.publish(
        paymentFailed({ paymentId: payment.id, eventId: payment.eventId, userId: payment.userId }),
      );
      return;
    }

    logger.debug({ eventType }, 'Razorpay webhook event ignored');
  }
}
