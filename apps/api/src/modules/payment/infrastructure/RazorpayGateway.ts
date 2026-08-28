import { createHmac, timingSafeEqual } from 'node:crypto';
import type {
  PaymentGateway,
  CreateOrderInput,
  CreatedOrder,
  VerifyPaymentInput,
} from '../domain/PaymentGateway';

const RAZORPAY_ORDERS_URL = 'https://api.razorpay.com/v1/orders';

/**
 * Razorpay adapter — the only file in the payment context that knows Razorpay
 * exists. Deliberately uses `fetch` + Node's `crypto` rather than the
 * `razorpay` SDK: the two things we need (create an order, verify an HMAC)
 * are a few lines each, and avoiding the dependency keeps the adapter trivial
 * to reason about and the bundle small.
 *
 * Signature schemes (both HMAC-SHA256, hex):
 *   - checkout handshake: sign `${order_id}|${payment_id}` with the KEY SECRET
 *   - webhook:            sign the raw request body with the WEBHOOK SECRET
 */
export class RazorpayGateway implements PaymentGateway {
  constructor(
    private readonly keyId: string,
    private readonly keySecret: string,
    private readonly webhookSecret: string | null,
  ) {}

  get publicKey(): string {
    return this.keyId;
  }

  async createOrder(input: CreateOrderInput): Promise<CreatedOrder> {
    const auth = Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64');
    const res = await fetch(RAZORPAY_ORDERS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amount,
        currency: input.currency,
        receipt: input.receipt,
        notes: input.notes ?? {},
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new Error(`Razorpay order creation failed (${res.status}): ${detail}`);
    }

    const body = (await res.json()) as { id?: string };
    if (!body.id) throw new Error('Razorpay order creation returned no id');
    return { providerOrderId: body.id };
  }

  verifyPaymentSignature(input: VerifyPaymentInput): boolean {
    const expected = createHmac('sha256', this.keySecret)
      .update(`${input.providerOrderId}|${input.providerPaymentId}`)
      .digest('hex');
    return safeEqualHex(expected, input.signature);
  }

  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean {
    if (!this.webhookSecret) return false;
    const expected = createHmac('sha256', this.webhookSecret)
      .update(typeof rawBody === 'string' ? rawBody : rawBody.toString())
      .digest('hex');
    return safeEqualHex(expected, signature);
  }
}

/** Constant-time compare of two hex strings; false rather than throw on a length/shape mismatch. */
function safeEqualHex(a: string, b: string): boolean {
  if (typeof b !== 'string' || a.length !== b.length) return false;
  try {
    return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
  } catch {
    return false;
  }
}
