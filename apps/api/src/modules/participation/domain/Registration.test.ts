import { describe, it, expect } from "vitest";
import { Registration } from "./Registration";

describe("Registration", () => {
  it("creates with default config", () => {
    const reg = Registration.create("event-1");
    expect(reg.eventId).toBe("event-1");
    expect(reg.approvalStrategy).toBe("Automatic");
    expect(reg.isOpen).toBe(false);
    expect(reg.capacity.maxParticipants).toBeNull();
    expect(reg.questions).toHaveLength(0);
  });

  it("opens and closes", () => {
    const reg = Registration.create("event-1");
    reg.open();
    expect(reg.isOpen).toBe(true);
    reg.close();
    expect(reg.isOpen).toBe(false);
  });

  it("adds and removes questions", () => {
    const reg = Registration.create("event-1");
    const q1 = reg.addQuestion("Name", "Text", true);
    const q2 = reg.addQuestion("Department", "Select", false, ["CS", "EE", "ME"]);
    expect(reg.questions).toHaveLength(2);
    expect(q1.order).toBe(0);
    expect(q2.order).toBe(1);

    reg.removeQuestion(q1.id);
    expect(reg.questions).toHaveLength(1);
    expect(reg.questions[0]!.order).toBe(0);
  });

  it("sets capacity policy", () => {
    const reg = Registration.create("event-1");
    reg.setCapacity({ maxParticipants: 100, allowWaitlist: true });
    expect(reg.capacity.maxParticipants).toBe(100);
    expect(reg.capacity.allowWaitlist).toBe(true);
  });

  it("rejects invalid capacity", () => {
    const reg = Registration.create("event-1");
    expect(() => reg.setCapacity({ maxParticipants: 0, allowWaitlist: false })).toThrow("at least 1");
  });

  it("sets registration window", () => {
    const reg = Registration.create("event-1");
    const opens = new Date("2026-09-01");
    const closes = new Date("2026-09-10");
    reg.setWindow({ opensAt: opens, closesAt: closes });
    expect(reg.window).toBeTruthy();
  });

  it("rejects invalid window", () => {
    const reg = Registration.create("event-1");
    expect(() =>
      reg.setWindow({ opensAt: new Date("2026-09-10"), closesAt: new Date("2026-09-01") }),
    ).toThrow("after open date");
  });

  it("canAcceptEnrollment when open with no constraints", () => {
    const reg = Registration.create("event-1");
    reg.open();
    expect(reg.canAcceptEnrollment(0)).toBe(true);
  });

  it("canAcceptEnrollment rejects when closed", () => {
    const reg = Registration.create("event-1");
    expect(reg.canAcceptEnrollment(0)).toBe(false);
  });

  it("canAcceptEnrollment checks capacity", () => {
    const reg = Registration.create("event-1");
    reg.open();
    reg.setCapacity({ maxParticipants: 2, allowWaitlist: false });
    expect(reg.canAcceptEnrollment(2)).toBe(false);
    expect(reg.canAcceptEnrollment(1)).toBe(true);
  });

  it("canAcceptEnrollment allows waitlist when at capacity", () => {
    const reg = Registration.create("event-1");
    reg.open();
    reg.setCapacity({ maxParticipants: 2, allowWaitlist: true });
    expect(reg.canAcceptEnrollment(2)).toBe(true);
  });

  it("canAcceptEnrollment checks window", () => {
    const reg = Registration.create("event-1");
    reg.open();
    reg.setWindow({ opensAt: new Date("2099-01-01"), closesAt: new Date("2099-12-31") });
    expect(reg.canAcceptEnrollment(0)).toBe(false);
  });
});
