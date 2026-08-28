import type { PaymentRepository } from '../domain/PaymentRepository';
import type { Payment } from '../domain/Payment';

export class InMemoryPaymentRepository implements PaymentRepository {
  private payments: Payment[] = [];

  async findById(id: string): Promise<Payment | null> {
    return this.payments.find((p) => p.id === id) ?? null;
  }

  async findByProviderOrderId(providerOrderId: string): Promise<Payment | null> {
    return this.payments.find((p) => p.providerOrderId === providerOrderId) ?? null;
  }

  async findByEventAndUser(eventId: string, userId: string): Promise<Payment | null> {
    return this.payments.find((p) => p.eventId === eventId && p.userId === userId) ?? null;
  }

  async save(payment: Payment): Promise<void> {
    this.payments.push(payment);
  }

  async update(payment: Payment): Promise<void> {
    const idx = this.payments.findIndex((p) => p.id === payment.id);
    if (idx !== -1) this.payments[idx] = payment;
  }
}
