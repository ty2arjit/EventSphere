import { randomUUID } from 'node:crypto';

/**
 * A single attempt by one user to pay the registration fee for one event.
 *
 * Lifecycle (a deliberately tiny state machine):
 *
 *   Created ──paid──▶ Paid ──refund──▶ Refunded
 *      │
 *      └──fail──▶ Failed ──(retry creates a fresh order on the same row)──▶ Created
 *
 * Amounts are in the currency minor unit (paise) and always integers.
 *
 * The aggregate is provider-agnostic: it holds opaque `providerOrderId` /
 * `providerPaymentId` strings but knows nothing about Razorpay's HTTP API or
 * signature scheme — that lives entirely in the infrastructure adapter.
 */
export type PaymentStatus = 'Created' | 'Paid' | 'Failed' | 'Refunded';

export interface PaymentProps {
  id: string;
  eventId: string;
  userId: string;
  enrollmentId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Payment {
  private constructor(private readonly props: PaymentProps) {}

  static create(input: {
    eventId: string;
    userId: string;
    enrollmentId: string | null;
    amount: number;
    currency: string;
    providerOrderId: string;
    provider?: string;
  }): Payment {
    if (!Number.isInteger(input.amount) || input.amount <= 0) {
      throw new Error('Payment amount must be a positive integer (minor units)');
    }
    const now = new Date();
    return new Payment({
      id: randomUUID(),
      eventId: input.eventId,
      userId: input.userId,
      enrollmentId: input.enrollmentId,
      amount: input.amount,
      currency: input.currency,
      status: 'Created',
      provider: input.provider ?? 'razorpay',
      providerOrderId: input.providerOrderId,
      providerPaymentId: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  static fromPersistence(props: PaymentProps): Payment {
    return new Payment(props);
  }

  get id(): string { return this.props.id; }
  get eventId(): string { return this.props.eventId; }
  get userId(): string { return this.props.userId; }
  get enrollmentId(): string | null { return this.props.enrollmentId; }
  get amount(): number { return this.props.amount; }
  get currency(): string { return this.props.currency; }
  get status(): PaymentStatus { return this.props.status; }
  get provider(): string { return this.props.provider; }
  get providerOrderId(): string { return this.props.providerOrderId; }
  get providerPaymentId(): string | null { return this.props.providerPaymentId; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get isPaid(): boolean { return this.props.status === 'Paid'; }

  linkEnrollment(enrollmentId: string): void {
    this.props.enrollmentId = enrollmentId;
    this.props.updatedAt = new Date();
  }

  /**
   * Confirm the payment. Idempotent: calling it again with the SAME provider
   * payment id is a no-op (the verify endpoint and the webhook race each
   * other and both call this). A DIFFERENT payment id on an already-paid
   * order is a genuine anomaly and throws.
   */
  markPaid(providerPaymentId: string): void {
    if (this.props.status === 'Paid') {
      if (this.props.providerPaymentId !== providerPaymentId) {
        throw new Error(
          `Payment ${this.props.id} is already settled with a different provider payment id`,
        );
      }
      return;
    }
    if (this.props.status === 'Refunded') {
      throw new Error(`Payment ${this.props.id} is already refunded`);
    }
    this.props.status = 'Paid';
    this.props.providerPaymentId = providerPaymentId;
    this.props.updatedAt = new Date();
  }

  markFailed(): void {
    if (this.props.status === 'Paid' || this.props.status === 'Refunded') {
      throw new Error(`Cannot fail a payment in "${this.props.status}" status`);
    }
    this.props.status = 'Failed';
    this.props.updatedAt = new Date();
  }

  /**
   * Reuse this row for a retry after a failed/abandoned attempt: point it at
   * a fresh provider order and reset to Created.
   */
  restartWithOrder(providerOrderId: string, amount: number): void {
    if (this.props.status === 'Paid' || this.props.status === 'Refunded') {
      throw new Error(`Cannot restart a payment in "${this.props.status}" status`);
    }
    this.props.providerOrderId = providerOrderId;
    this.props.providerPaymentId = null;
    this.props.amount = amount;
    this.props.status = 'Created';
    this.props.updatedAt = new Date();
  }
}
