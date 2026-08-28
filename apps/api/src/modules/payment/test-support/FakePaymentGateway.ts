import { createHmac } from 'node:crypto';
import type {
  PaymentGateway,
  CreateOrderInput,
  CreatedOrder,
  VerifyPaymentInput,
} from '../domain/PaymentGateway';

/**
 * Deterministic in-memory stand-in for Razorpay. Uses the SAME HMAC schemes
 * as the real adapter so signature-verification tests exercise real crypto,
 * just with a known secret. `signPayment` / `signWebhook` let a test forge a
 * valid caller-side signature.
 */
export class FakePaymentGateway implements PaymentGateway {
  public readonly createdOrders: CreateOrderInput[] = [];
  private counter = 0;

  constructor(
    public readonly publicKey = 'rzp_test_fake',
    private readonly keySecret = 'fake_secret',
    private readonly webhookSecret: string | null = 'fake_webhook_secret',
  ) {}

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    this.createdOrders.push(input);
    this.counter += 1;
    return { providerOrderId: `order_fake_${this.counter}` };
  }

  verifyPaymentSignature(input: VerifyPaymentInput): boolean {
    return input.signature === this.signPayment(input.providerOrderId, input.providerPaymentId);
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    if (!this.webhookSecret) return false;
    return signature === this.signWebhook(rawBody);
  }

  signPayment(orderId: string, paymentId: string): string {
    return createHmac('sha256', this.keySecret).update(`${orderId}|${paymentId}`).digest('hex');
  }

  signWebhook(rawBody: Buffer | string): string {
    return createHmac('sha256', this.webhookSecret ?? '')
      .update(typeof rawBody === 'string' ? rawBody : rawBody.toString())
      .digest('hex');
  }
}
