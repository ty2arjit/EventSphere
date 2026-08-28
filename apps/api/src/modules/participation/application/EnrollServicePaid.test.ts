/**
 * The paid-event enrollment branch: a fee-charging event parks the enrollee
 * in PendingPayment (reserving the seat) until the payment context reports
 * success, at which point confirmPaidEnrollment moves it to Approved.
 */
import { describe, expect, it } from "vitest";
import { EnrollService } from "./EnrollService";
import { InMemoryRegistrationRepository } from "../test-support/InMemoryRegistrationRepository";
import { InMemoryEnrollmentRepository } from "../test-support/InMemoryEnrollmentRepository";
import { InMemoryEventRepository } from "../../event-management/test-support/InMemoryEventRepository";
import { RecordingEventPublisher } from "../../profile/test-support/RecordingEventPublisher";
import { Registration } from "../domain/Registration";
import { Event } from "../../event-management/domain/Event";

async function build(paid: boolean) {
  const registrationRepo = new InMemoryRegistrationRepository();
  const enrollmentRepo = new InMemoryEnrollmentRepository();
  const eventRepo = new InMemoryEventRepository();
  const publisher = new RecordingEventPublisher();

  const event = Event.create({ communityId: "c1", name: "Paid Summit", slug: "paid-summit" });
  if (paid) event.updatePricing({ isPaid: true, amount: 50000, currency: "INR" });
  await eventRepo.save(event);

  const registration = Registration.create(event.id, "Automatic");
  registration.open();
  await registrationRepo.save(registration);

  const service = new EnrollService(registrationRepo, enrollmentRepo, publisher, eventRepo);
  return { service, event, enrollmentRepo };
}

describe("EnrollService — paid events", () => {
  it("free event: enrollment is auto-approved immediately", async () => {
    const { service, event } = await build(false);
    const enrollment = await service.enroll(event.id, "u1", []);
    expect(enrollment.status).toBe("Approved");
  });

  it("paid event: enrollment is parked in PendingPayment", async () => {
    const { service, event } = await build(true);
    const enrollment = await service.enroll(event.id, "u1", []);
    expect(enrollment.status).toBe("PendingPayment");
  });

  it("re-enrolling while payment is pending returns the same enrollment", async () => {
    const { service, event } = await build(true);
    const first = await service.enroll(event.id, "u1", []);
    const second = await service.enroll(event.id, "u1", []);
    expect(second.id).toBe(first.id);
  });

  it("confirmPaidEnrollment advances PendingPayment to Approved and is idempotent", async () => {
    const { service, event, enrollmentRepo } = await build(true);
    await service.enroll(event.id, "u1", []);

    await service.confirmPaidEnrollment(event.id, "u1");
    let enrollment = await enrollmentRepo.findByEventAndUser(event.id, "u1");
    expect(enrollment?.status).toBe("Approved");

    // Second call (webhook after verify) is a harmless no-op.
    await service.confirmPaidEnrollment(event.id, "u1");
    enrollment = await enrollmentRepo.findByEventAndUser(event.id, "u1");
    expect(enrollment?.status).toBe("Approved");
  });
});
