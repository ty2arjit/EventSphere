import type { Payment } from './Payment';

export interface PaymentRepository {
  findById(id: string): Promise<Payment | null>;
  findByProviderOrderId(providerOrderId: string): Promise<Payment | null>;
  findByEventAndUser(eventId: string, userId: string): Promise<Payment | null>;
  save(payment: Payment): Promise<void>;
  update(payment: Payment): Promise<void>;
}
