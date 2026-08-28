import { DomainError, DomainErrorKind } from '../../../shared/errors/DomainError';

export class PaymentNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'PAYMENT_NOT_FOUND';
  constructor(ref: string) { super(`Payment not found: ${ref}`); }
}

export class EventNotPaidError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'EVENT_NOT_PAID';
  constructor(eventId: string) {
    super(`Event ${eventId} has no registration fee — no payment is required`);
  }
}

export class EventNotFoundForPaymentError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'EVENT_NOT_FOUND';
  constructor(eventId: string) { super(`Event not found: ${eventId}`); }
}

export class PaymentSignatureInvalidError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'PAYMENT_SIGNATURE_INVALID';
  constructor() { super('Payment signature verification failed'); }
}

export class WebhookSignatureInvalidError extends DomainError {
  readonly kind: DomainErrorKind = 'UNAUTHORIZED';
  readonly code = 'WEBHOOK_SIGNATURE_INVALID';
  constructor() { super('Webhook signature verification failed'); }
}

export class PaymentGatewayUnavailableError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'PAYMENT_GATEWAY_UNAVAILABLE';
  constructor() {
    super('The payment gateway is not configured on this server');
  }
}
