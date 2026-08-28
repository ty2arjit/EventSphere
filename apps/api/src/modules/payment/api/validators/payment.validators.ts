import { z } from 'zod';
import { Request, Response, NextFunction } from 'express';

function makeValidator(schema: z.ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    schema.parse(req.body);
    next();
  };
}

const createOrderSchema = z.object({
  eventId: z.string().uuid(),
});

const verifySchema = z.object({
  // Razorpay's ids and signature — opaque provider strings, not our uuids.
  orderId: z.string().min(1),
  paymentId: z.string().min(1),
  signature: z.string().min(1),
});

export const validateCreateOrder = makeValidator(createOrderSchema);
export const validateVerifyPayment = makeValidator(verifySchema);
