import express, { Router } from 'express';
import type { PaymentRepository } from '../../domain/PaymentRepository';
import type { PaymentGateway } from '../../domain/PaymentGateway';
import type { EventPricingReader } from '../../application/EventPricingReader';
import type { EventPublisher } from '../../../../shared/events/EventPublisher';
import { CreatePaymentOrderService } from '../../application/CreatePaymentOrderService';
import { VerifyPaymentService } from '../../application/VerifyPaymentService';
import { HandleRazorpayWebhookService } from '../../application/HandleRazorpayWebhookService';
import { PaymentController } from '../controllers/PaymentController';
import { requireAuth } from '../../../authentication/api/middleware/requireAuth';
import { validateCreateOrder, validateVerifyPayment } from '../validators/payment.validators';

export interface PaymentRouterDependencies {
  paymentRepository: PaymentRepository;
  paymentGateway: PaymentGateway;
  eventPricingReader: EventPricingReader;
  eventPublisher: EventPublisher;
}

function buildController(deps: PaymentRouterDependencies): PaymentController {
  return new PaymentController(
    new CreatePaymentOrderService(deps.paymentRepository, deps.paymentGateway, deps.eventPricingReader),
    new VerifyPaymentService(deps.paymentRepository, deps.paymentGateway, deps.eventPublisher),
    new HandleRazorpayWebhookService(deps.paymentRepository, deps.paymentGateway, deps.eventPublisher),
  );
}

/**
 * User-facing endpoints, mounted at /api/v1/payments with the normal JSON +
 * auth + CSRF middleware stack.
 */
export function createPaymentRouter(deps: PaymentRouterDependencies): Router {
  const controller = buildController(deps);
  const router = Router();

  // Create (or resume) a Razorpay order for the current user's registration fee.
  router.post('/orders', requireAuth, validateCreateOrder, controller.createOrder);
  // Fast-path confirmation from the browser checkout handshake.
  router.post('/verify', requireAuth, validateVerifyPayment, controller.verify);

  return router;
}

/**
 * The webhook, mounted SEPARATELY at /api/v1/payments/webhook *before*
 * express.json() and the CSRF guard in createApp — signature verification
 * needs the exact raw bytes Razorpay signed, and Razorpay can't send our
 * X-Requested-With CSRF header. Authenticity comes from the HMAC instead.
 */
export function createPaymentWebhookApp(deps: PaymentRouterDependencies): Router {
  const controller = buildController(deps);
  const router = Router();
  router.post('/', express.raw({ type: '*/*' }), controller.webhook);
  return router;
}
