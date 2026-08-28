import type { PrismaClient } from '@prisma/client';
import type { PaymentRepository } from '../domain/PaymentRepository';
import { Payment, type PaymentProps, type PaymentStatus } from '../domain/Payment';

function toDomain(row: {
  id: string;
  eventId: string;
  userId: string;
  enrollmentId: string | null;
  amount: number;
  currency: string;
  status: string;
  provider: string;
  providerOrderId: string;
  providerPaymentId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): Payment {
  const props: PaymentProps = {
    id: row.id,
    eventId: row.eventId,
    userId: row.userId,
    enrollmentId: row.enrollmentId,
    amount: row.amount,
    currency: row.currency,
    status: row.status as PaymentStatus,
    provider: row.provider,
    providerOrderId: row.providerOrderId,
    providerPaymentId: row.providerPaymentId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  return Payment.fromPersistence(props);
}

export class PrismaPaymentRepository implements PaymentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Payment | null> {
    const row = await this.prisma.payment.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByProviderOrderId(providerOrderId: string): Promise<Payment | null> {
    const row = await this.prisma.payment.findUnique({ where: { providerOrderId } });
    return row ? toDomain(row) : null;
  }

  async findByEventAndUser(eventId: string, userId: string): Promise<Payment | null> {
    const row = await this.prisma.payment.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    return row ? toDomain(row) : null;
  }

  async save(payment: Payment): Promise<void> {
    await this.prisma.payment.create({
      data: {
        id: payment.id,
        eventId: payment.eventId,
        userId: payment.userId,
        enrollmentId: payment.enrollmentId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider,
        providerOrderId: payment.providerOrderId,
        providerPaymentId: payment.providerPaymentId,
      },
    });
  }

  async update(payment: Payment): Promise<void> {
    await this.prisma.payment.update({
      where: { id: payment.id },
      data: {
        enrollmentId: payment.enrollmentId,
        amount: payment.amount,
        status: payment.status,
        providerOrderId: payment.providerOrderId,
        providerPaymentId: payment.providerPaymentId,
        updatedAt: payment.updatedAt,
      },
    });
  }
}
