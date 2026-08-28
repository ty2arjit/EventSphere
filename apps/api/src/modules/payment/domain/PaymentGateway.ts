/**
 * Port for an external payment provider (Razorpay today).
 *
 * The application layer depends only on this interface — it never imports the
 * Razorpay SDK, HTTP client, or crypto. That keeps the payment flow unit-
 * testable with an in-memory fake and means swapping to Stripe later touches
 * exactly one file (the adapter).
 */
export interface CreateOrderInput {
  /** Minor units (paise). */
  amount: number;
  currency: string;
  /** Our own reference, echoed back by the provider — we use the Payment id. */
  receipt: string;
  notes?: Record<string, string>;
}

export interface CreatedOrder {
  providerOrderId: string;
}

export interface VerifyPaymentInput {
  providerOrderId: string;
  providerPaymentId: string;
  signature: string;
}

export interface PaymentGateway {
  /** The publishable key id the browser checkout widget needs. */
  readonly publicKey: string;

  createOrder(input: CreateOrderInput): Promise<CreatedOrder>;

  /**
   * Verify the signature the checkout widget hands back to the browser after
   * a successful payment (HMAC-SHA256 of `order_id|payment_id`).
   */
  verifyPaymentSignature(input: VerifyPaymentInput): boolean;

  /**
   * Verify a webhook request came from the provider (HMAC-SHA256 of the raw
   * request body against the webhook secret). Returns false if no webhook
   * secret is configured — an unverifiable webhook must never be trusted.
   */
  verifyWebhookSignature(rawBody: Buffer | string, signature: string): boolean;
}
