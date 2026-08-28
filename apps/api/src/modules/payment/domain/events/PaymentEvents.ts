import { createDomainEvent, type DomainEvent } from '../../../../shared/events/DomainEvent';

export const PAYMENT_SUCCEEDED = 'PaymentSucceeded';
export const PAYMENT_FAILED = 'PaymentFailed';

export interface PaymentSucceededPayload {
  paymentId: string;
  eventId: string;
  userId: string;
  enrollmentId: string | null;
  amount: number;
  currency: string;
}

export function paymentSucceeded(payload: PaymentSucceededPayload): DomainEvent<PaymentSucceededPayload> {
  return createDomainEvent({
    eventType: PAYMENT_SUCCEEDED,
    aggregateId: payload.paymentId,
    aggregateType: 'Payment',
    payload,
  });
}

export interface PaymentFailedPayload {
  paymentId: string;
  eventId: string;
  userId: string;
}

export function paymentFailed(payload: PaymentFailedPayload): DomainEvent<PaymentFailedPayload> {
  return createDomainEvent({
    eventType: PAYMENT_FAILED,
    aggregateId: payload.paymentId,
    aggregateType: 'Payment',
    payload,
  });
}
