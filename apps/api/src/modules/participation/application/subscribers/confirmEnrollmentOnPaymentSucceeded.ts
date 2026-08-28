import { DomainEvent } from "../../../../shared/events/DomainEvent";
import type { PaymentSucceededPayload } from "../../../payment/domain/events/PaymentEvents";
import type { EnrollService } from "../EnrollService";
import { logger } from "../../../../shared/logger";

/**
 * Cross-context integration point (Constitution Article 12 — allowed via
 * events). When the Payment context publishes PaymentSucceeded, Participation
 * moves the enrollee's PendingPayment enrollment forward to Approved/Pending.
 *
 * Payment never imports EnrollService or Enrollment; the wiring is done at
 * the composition root (server.ts), which passes an already-constructed
 * EnrollService into this factory.
 */
export function makeConfirmEnrollmentOnPaymentSucceeded(enrollService: EnrollService) {
  return async function confirmEnrollmentOnPaymentSucceeded(event: DomainEvent): Promise<void> {
    const payload = event.payload as PaymentSucceededPayload;
    try {
      await enrollService.confirmPaidEnrollment(payload.eventId, payload.userId);
    } catch (err) {
      logger.error(
        { err, eventId: payload.eventId, userId: payload.userId, paymentId: payload.paymentId },
        "Failed to confirm enrollment after PaymentSucceeded",
      );
      throw err;
    }
  };
}
