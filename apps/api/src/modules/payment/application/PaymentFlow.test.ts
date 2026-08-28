/**
 * Covers the payment context end to end with an in-memory gateway:
 * create an order, confirm it via the browser handshake, and confirm it via
 * the webhook — asserting the amount is server-authoritative, signatures are
 * enforced, both confirmation paths are idempotent, and PaymentSucceeded is
 * published exactly once.
 */
import { describe, expect, it } from "vitest";
import { CreatePaymentOrderService } from "./CreatePaymentOrderService";
import { VerifyPaymentService } from "./VerifyPaymentService";
import { HandleRazorpayWebhookService } from "./HandleRazorpayWebhookService";
import { InMemoryPaymentRepository } from "../test-support/InMemoryPaymentRepository";
import { FakePaymentGateway } from "../test-support/FakePaymentGateway";
import { StubEventPricingReader } from "../test-support/StubEventPricingReader";
import { RecordingEventPublisher } from "../../profile/test-support/RecordingEventPublisher";
import { PAYMENT_SUCCEEDED } from "../domain/events/PaymentEvents";
import { EventNotPaidError, PaymentSignatureInvalidError, WebhookSignatureInvalidError } from "../domain/errors";

const EVENT_ID = "11111111-1111-1111-1111-111111111111";
const USER_ID = "22222222-2222-2222-2222-222222222222";

function build() {
  const repo = new InMemoryPaymentRepository();
  const gateway = new FakePaymentGateway();
  const pricing = new StubEventPricingReader();
  const publisher = new RecordingEventPublisher();
  pricing.set(EVENT_ID, { isPaid: true, amount: 50000, currency: "INR" });
  return {
    repo,
    gateway,
    pricing,
    publisher,
    createOrder: new CreatePaymentOrderService(repo, gateway, pricing),
    verify: new VerifyPaymentService(repo, gateway, publisher),
    webhook: new HandleRazorpayWebhookService(repo, gateway, publisher),
  };
}

describe("CreatePaymentOrderService", () => {
  it("creates an order priced from the event, not the client", async () => {
    const { createOrder, gateway } = build();
    const view = await createOrder.execute({ eventId: EVENT_ID, userId: USER_ID });
    expect(view.amount).toBe(50000);
    expect(view.currency).toBe("INR");
    expect(view.keyId).toBe("rzp_test_fake");
    expect(gateway.createdOrders).toHaveLength(1);
    expect(gateway.createdOrders[0]?.amount).toBe(50000);
  });

  it("reuses the pending order on a repeat call (idempotent)", async () => {
    const { createOrder, gateway } = build();
    const a = await createOrder.execute({ eventId: EVENT_ID, userId: USER_ID });
    const b = await createOrder.execute({ eventId: EVENT_ID, userId: USER_ID });
    expect(b.providerOrderId).toBe(a.providerOrderId);
    expect(gateway.createdOrders).toHaveLength(1);
  });

  it("rejects an order for a free event", async () => {
    const { createOrder, pricing } = build();
    pricing.set(EVENT_ID, { isPaid: false, amount: null, currency: "INR" });
    await expect(createOrder.execute({ eventId: EVENT_ID, userId: USER_ID })).rejects.toBeInstanceOf(
      EventNotPaidError,
    );
  });
});

describe("VerifyPaymentService", () => {
  it("confirms a payment with a valid signature and publishes PaymentSucceeded once", async () => {
    const { createOrder, verify, gateway, publisher } = build();
    const order = await createOrder.execute({ eventId: EVENT_ID, userId: USER_ID });
    const paymentId = "pay_abc123";
    const signature = gateway.signPayment(order.providerOrderId, paymentId);

    const result = await verify.execute({
      providerOrderId: order.providerOrderId,
      providerPaymentId: paymentId,
      signature,
    });

    expect(result.status).toBe("Paid");
    expect(publisher.published.filter((e) => e.eventType === PAYMENT_SUCCEEDED)).toHaveLength(1);

    // Idempotent: verifying again is a no-op, no second event.
    await verify.execute({ providerOrderId: order.providerOrderId, providerPaymentId: paymentId, signature });
    expect(publisher.published.filter((e) => e.eventType === PAYMENT_SUCCEEDED)).toHaveLength(1);
  });

  it("rejects a tampered signature", async () => {
    const { createOrder, verify } = build();
    const order = await createOrder.execute({ eventId: EVENT_ID, userId: USER_ID });
    await expect(
      verify.execute({
        providerOrderId: order.providerOrderId,
        providerPaymentId: "pay_abc123",
        signature: "deadbeef",
      }),
    ).rejects.toBeInstanceOf(PaymentSignatureInvalidError);
  });
});

describe("HandleRazorpayWebhookService", () => {
  it("confirms via a signed payment.captured webhook", async () => {
    const { createOrder, webhook, gateway, publisher } = build();
    const order = await createOrder.execute({ eventId: EVENT_ID, userId: USER_ID });
    const raw = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: "pay_hook", order_id: order.providerOrderId } } },
    });

    await webhook.execute(raw, gateway.signWebhook(raw));

    expect(publisher.published.filter((e) => e.eventType === PAYMENT_SUCCEEDED)).toHaveLength(1);
  });

  it("rejects an unsigned webhook", async () => {
    const { webhook } = build();
    const raw = JSON.stringify({ event: "payment.captured", payload: {} });
    await expect(webhook.execute(raw, "nope")).rejects.toBeInstanceOf(WebhookSignatureInvalidError);
  });

  it("does not double-confirm when verify already settled the payment", async () => {
    const { createOrder, verify, webhook, gateway, publisher } = build();
    const order = await createOrder.execute({ eventId: EVENT_ID, userId: USER_ID });
    const paymentId = "pay_abc123";
    await verify.execute({
      providerOrderId: order.providerOrderId,
      providerPaymentId: paymentId,
      signature: gateway.signPayment(order.providerOrderId, paymentId),
    });
    const raw = JSON.stringify({
      event: "payment.captured",
      payload: { payment: { entity: { id: paymentId, order_id: order.providerOrderId } } },
    });
    await webhook.execute(raw, gateway.signWebhook(raw));
    expect(publisher.published.filter((e) => e.eventType === PAYMENT_SUCCEEDED)).toHaveLength(1);
  });
});
