import type { PaymentRepository } from '../domain/PaymentRepository';
import type { PaymentGateway } from '../domain/PaymentGateway';
import type { EventPublisher } from '../../../shared/events/EventPublisher';
import { PaymentNotFoundError, PaymentSignatureInvalidError } from '../domain/errors';
import { paymentSucceeded } from '../domain/events/PaymentEvents';

export interface VerifyPaymentInput {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

/**
 * Confirms a payment from the signed handshake the checkout widget returns to
 * the browser. This is the fast path — good UX, instant confirmation — but it
 * is NOT the only path: the Razorpay webhook (HandleRazorpayWebhookService)
 * is the source of truth for users who close the tab mid-redirect. Both call
 * `Payment.markPaid`, which is idempotent, so whichever lands first wins and
 * the second is a harmless no-op.
 */
export class VerifyPaymentService {
  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly gateway: PaymentGateway,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(input: VerifyPaymentInput): Promise<{ status: string }> {
    const payment = await this.paymentRepo.findByProviderOrderId(input.providerOrderId);
    if (!payment) throw new PaymentNotFoundError(input.providerOrderId);

    if (payment.isPaid) return { status: payment.status };

    const ok = this.gateway.verifyPaymentSignature({
      providerOrderId: input.providerOrderId,
      providerPaymentId: input.providerPaymentId,
      signature: input.signature,
    });
    if (!ok) throw new PaymentSignatureInvalidError();

    payment.markPaid(input.providerPaymentId);
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

    return { status: payment.status };
  }
}
