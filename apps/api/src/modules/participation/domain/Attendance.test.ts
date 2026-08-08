import { describe, it, expect } from "vitest";
import { Attendance } from "./Attendance";

describe("Attendance", () => {
  function makeAttendance() {
    return Attendance.checkIn("enroll-1", "event-1", "session-1", "user-1");
  }

  it("creates with Present status and checkInAt", () => {
    const a = makeAttendance();
    expect(a.status).toBe("Present");
    expect(a.checkInAt).toBeTruthy();
    expect(a.checkOutAt).toBeNull();
  });

  it("checks out", () => {
    const a = makeAttendance();
    a.checkOut();
    expect(a.checkOutAt).toBeTruthy();
  });

  it("rejects double checkout", () => {
    const a = makeAttendance();
    a.checkOut();
    expect(() => a.checkOut()).toThrow("Already checked out");
  });

  it("marks late", () => {
    const a = makeAttendance();
    a.markLate();
    expect(a.status).toBe("Late");
  });

  it("verifies attendance", () => {
    const a = makeAttendance();
    a.verify("verifier-1");
    expect(a.verifiedBy).toBe("verifier-1");
  });

  it("marks absent", () => {
    const a = makeAttendance();
    a.markAbsent();
    expect(a.status).toBe("Absent");
    expect(a.checkInAt).toBeNull();
  });

  it("excuses", () => {
    const a = makeAttendance();
    a.excuse();
    expect(a.status).toBe("Excused");
  });
});
