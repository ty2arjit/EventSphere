import { createPaymentOrder, verifyPayment } from "../api/paymentClient";
import { getErrorMessage } from "@/lib/api/errorMessages";

const RAZORPAY_SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

interface RazorpayHandlerResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  order_id: string;
  name: string;
  description?: string;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  handler: (response: RazorpayHandlerResponse) => void;
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, cb: (payload: unknown) => void) => void;
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

let scriptPromise: Promise<void> | null = null;

/** Load Razorpay's checkout.js once, lazily — it's ~40KB we only need on paid events. */
function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("not in browser"));
  if (window.Razorpay) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Failed to load the payment widget"));
    };
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export type CheckoutResult =
  | { status: "paid" }
  | { status: "dismissed" }
  | { status: "error"; message: string };

export interface StartCheckoutParams {
  eventId: string;
  eventName: string;
  prefill?: { name?: string; email?: string };
}

/**
 * Full paid-registration flow from the browser:
 *   1. ask our API for a Razorpay order (amount is server-authoritative)
 *   2. open Razorpay's hosted modal
 *   3. on success, hand the signed handshake back to our API to verify
 *
 * Resolves with a discriminated result rather than throwing so the caller can
 * branch on paid / dismissed / error without a try-catch.
 */
export async function startRazorpayCheckout(params: StartCheckoutParams): Promise<CheckoutResult> {
  const orderResult = await createPaymentOrder(params.eventId);
  if (!orderResult.ok) {
    return { status: "error", message: getErrorMessage(orderResult.error) };
  }
  const order = orderResult.data;

  // The order already came back settled (e.g. paid in another tab) — nothing to do.
  if (order.status === "Paid") return { status: "paid" };

  try {
    await loadRazorpayScript();
  } catch (err) {
    return { status: "error", message: err instanceof Error ? err.message : "Payment widget unavailable" };
  }

  if (!window.Razorpay) {
    return { status: "error", message: "Payment widget unavailable" };
  }

  return new Promise<CheckoutResult>((resolve) => {
    let settled = false;
    const finish = (result: CheckoutResult) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    const rzp = new window.Razorpay!({
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      order_id: order.orderId,
      name: "EventSphere",
      description: `Registration — ${params.eventName}`,
      prefill: params.prefill,
      theme: { color: "#6366f1" },
      modal: {
        ondismiss: () => finish({ status: "dismissed" }),
      },
      handler: (response) => {
        void verifyPayment({
          orderId: response.razorpay_order_id,
          paymentId: response.razorpay_payment_id,
          signature: response.razorpay_signature,
        }).then((verifyResult) => {
          if (verifyResult.ok) {
            finish({ status: "paid" });
          } else {
            // Payment went through at Razorpay but our verify failed — the
            // webhook will still reconcile it server-side shortly.
            finish({
              status: "error",
              message:
                "Payment received — we're confirming it now. Refresh in a moment if your status hasn't updated.",
            });
          }
        });
      },
    });

    rzp.open();
  });
}
