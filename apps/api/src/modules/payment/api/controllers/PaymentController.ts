import { Request, Response, NextFunction } from 'express';
import { CreatePaymentOrderService } from '../../application/CreatePaymentOrderService';
import { VerifyPaymentService } from '../../application/VerifyPaymentService';
import { HandleRazorpayWebhookService } from '../../application/HandleRazorpayWebhookService';
import { toPaymentOrderResponse } from '../mappers/PaymentMapper';

export class PaymentController {
  constructor(
    private readonly createOrderService: CreatePaymentOrderService,
    private readonly verifyPaymentService: VerifyPaymentService,
    private readonly webhookService: HandleRazorpayWebhookService,
  ) {}

  createOrder = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const view = await this.createOrderService.execute({
        eventId: req.body.eventId,
        userId: req.user!.id,
      });
      res.status(201).json(toPaymentOrderResponse(view));
    } catch (err) { next(err); }
  };

  verify = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.verifyPaymentService.execute({
        providerOrderId: req.body.orderId,
        providerPaymentId: req.body.paymentId,
        signature: req.body.signature,
      });
      res.status(200).json(result);
    } catch (err) { next(err); }
  };

  // Mounted on a raw-body sub-app (see createPaymentWebhookApp) — req.body is a Buffer.
  webhook = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.header('x-razorpay-signature') ?? '';
      const raw: Buffer | string = Buffer.isBuffer(req.body)
        ? req.body
        : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body);
      await this.webhookService.execute(raw, signature);
      res.status(200).json({ received: true });
    } catch (err) { next(err); }
  };
}
