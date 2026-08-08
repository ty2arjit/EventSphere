import { describe, it, expect } from "vitest";
import { Enrollment } from "./Enrollment";

describe("Enrollment", () => {
  function makeEnrollment(autoApprove = false) {
    return Enrollment.create("reg-1", "event-1", "user-1", [{ questionId: "q1", value: "Alice" }], autoApprove);
  }

  it("creates as Pending by default", () => {
    const e = makeEnrollment();
    expect(e.status).toBe("Pending");
    expect(e.isActive).toBe(true);
  });

  it("creates as Approved when auto-approve is true", () => {
    const e = makeEnrollment(true);
    expect(e.status).toBe("Approved");
  });

  it("approves a pending enrollment", () => {
    const e = makeEnrollment();
    e.approve("reviewer-1");
    expect(e.status).toBe("Approved");
    expect(e.reviewedBy).toBe("reviewer-1");
  });

  it("rejects a pending enrollment", () => {
    const e = makeEnrollment();
    e.reject("reviewer-1");
    expect(e.status).toBe("Rejected");
    expect(e.isActive).toBe(false);
  });

  it("waitlists a pending enrollment", () => {
    const e = makeEnrollment();
    e.waitlist();
    expect(e.status).toBe("Waitlisted");
    expect(e.isActive).toBe(true);
  });

  it("approves a waitlisted enrollment", () => {
    const e = makeEnrollment();
    e.waitlist();
    e.approve("reviewer-1");
    expect(e.status).toBe("Approved");
  });

  it("cancels an approved enrollment", () => {
    const e = makeEnrollment(true);
    e.cancel();
    expect(e.status).toBe("Cancelled");
  });

  it("rejects cancel on already cancelled", () => {
    const e = makeEnrollment(true);
    e.cancel();
    expect(() => e.cancel()).toThrow("Cannot cancel");
  });

  it("rejects approve on rejected", () => {
    const e = makeEnrollment();
    e.reject("rev");
    expect(() => e.approve("rev")).toThrow("Cannot approve");
  });
});
