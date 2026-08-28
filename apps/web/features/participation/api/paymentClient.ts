import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";

export interface PaymentOrderResponse {
  paymentId: string;
  /** Razorpay order id — handed straight to the checkout widget. */
  orderId: string;
  /** Minor units (paise). */
  amount: number;
  currency: string;
  /** Razorpay publishable key id. */
  keyId: string;
  status: string;
}

/**
 * Create (or resume) the Razorpay order for the current user's registration
 * fee on a paid event. The amount is decided server-side from the event —
 * never sent from here.
 */
export function createPaymentOrder(
  eventId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<PaymentOrderResponse>> {
  return request<PaymentOrderResponse>("/api/v1/payments/orders", {
    method: "POST",
    body: { eventId },
    signal: options.signal,
  });
}

/**
 * Fast-path confirmation: hand the signed handshake from the checkout widget
 * back to the server. The Razorpay webhook is the source of truth if this
 * call never happens (tab closed mid-payment).
 */
export function verifyPayment(
  input: { orderId: string; paymentId: string; signature: string },
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ status: string }>> {
  return request<{ status: string }>("/api/v1/payments/verify", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}
