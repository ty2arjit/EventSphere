/**
 * Covers GenerateCheckInQrService and CheckInByQrService — the QR
 * check-in flow. A participant fetches a signed token (rendered as a QR
 * image), an organizer's device feeds that token back in, and only a
 * genuine, unexpired token for the right event results in an
 * attendance record.
 */
import { describe, expect, it } from "vitest";
import { GenerateCheckInQrService } from "./GenerateCheckInQrService";
import { CheckInByQrService } from "./CheckInByQrService";
import { AttendanceService } from "./AttendanceService";
import { QrTokenService } from "../infrastructure/QrTokenService";
import { InMemoryEnrollmentRepository } from "../test-support/InMemoryEnrollmentRepository";
import { RecordingEventPublisher } from "../../profile/test-support/RecordingEventPublisher";
import { Enrollment } from "../domain/Enrollment";
import type { Attendance } from "../domain/Attendance";
import type { AttendanceRepository } from "../domain/AttendanceRepository";
import {
  EnrollmentNotFoundError,
  EnrollmentNotApprovedError,
  EnrollmentAccessDeniedError,
  InvalidCheckInTokenError,
} from "../domain/errors";

class InMemoryAttendanceRepository implements AttendanceRepository {
  private records: Attendance[] = [];
  async findById(id: string) {
    return this.records.find((a) => a.id === id) ?? null;
  }
  async findBySessionAndUser(sessionId: string, userId: string) {
    return this.records.find((a) => a.sessionId === sessionId && a.userId === userId) ?? null;
  }
  async findByEventId(eventId: string) {
    return this.records.filter((a) => a.eventId === eventId);
  }
  async findBySessionId(sessionId: string) {
    return this.records.filter((a) => a.sessionId === sessionId);
  }
  async save(attendance: Attendance) {
    this.records.push(attendance);
  }
  async update(attendance: Attendance) {
    const idx = this.records.findIndex((a) => a.id === attendance.id);
    if (idx !== -1) this.records[idx] = attendance;
  }
}

const SECRET = "a".repeat(32);

function build() {
  const enrollmentRepository = new InMemoryEnrollmentRepository();
  const attendanceRepository = new InMemoryAttendanceRepository();
  const eventPublisher = new RecordingEventPublisher();
  const qrTokenService = new QrTokenService(SECRET);
  const attendanceService = new AttendanceService(attendanceRepository, eventPublisher);
  const generateService = new GenerateCheckInQrService(enrollmentRepository, qrTokenService);
  const checkInService = new CheckInByQrService(attendanceService, qrTokenService);
  return { enrollmentRepository, generateService, checkInService, qrTokenService };
}

describe("GenerateCheckInQrService", () => {
  it("generates a QR data URL and token for an approved enrollment's own owner", async () => {
    const { enrollmentRepository, generateService } = build();
    const enrollment = Enrollment.create("reg-1", "event-1", "user-1", [], true);
    await enrollmentRepository.save(enrollment);

    const result = await generateService.execute(enrollment.id, "user-1");

    expect(result.qrCodeDataUrl).toMatch(/^data:image\/png;base64,/);
    expect(result.token.split(".")).toHaveLength(3); // JWT shape
    expect(new Date(result.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it("rejects a requester who isn't the enrollment's owner", async () => {
    const { enrollmentRepository, generateService } = build();
    const enrollment = Enrollment.create("reg-1", "event-1", "user-1", [], true);
    await enrollmentRepository.save(enrollment);

    await expect(generateService.execute(enrollment.id, "someone-else")).rejects.toThrow(
      EnrollmentAccessDeniedError,
    );
  });

  it("rejects an enrollment that isn't Approved yet", async () => {
    const { enrollmentRepository, generateService } = build();
    const enrollment = Enrollment.create("reg-1", "event-1", "user-1", [], false); // Pending
    await enrollmentRepository.save(enrollment);

    await expect(generateService.execute(enrollment.id, "user-1")).rejects.toThrow(
      EnrollmentNotApprovedError,
    );
  });

  it("rejects an unknown enrollment id", async () => {
    const { generateService } = build();
    await expect(generateService.execute("nope", "user-1")).rejects.toThrow(EnrollmentNotFoundError);
  });
});

describe("CheckInByQrService", () => {
  it("checks the participant in when the token is genuine and for the right event", async () => {
    const { enrollmentRepository, generateService, checkInService } = build();
    const enrollment = Enrollment.create("reg-1", "event-1", "user-1", [], true);
    await enrollmentRepository.save(enrollment);
    const { token } = await generateService.execute(enrollment.id, "user-1");

    const attendance = await checkInService.execute(token, "event-1", "session-1");

    expect(attendance.userId).toBe("user-1");
    expect(attendance.eventId).toBe("event-1");
    expect(attendance.sessionId).toBe("session-1");
  });

  it("rejects a token issued for a different event", async () => {
    const { enrollmentRepository, generateService, checkInService } = build();
    const enrollment = Enrollment.create("reg-1", "event-1", "user-1", [], true);
    await enrollmentRepository.save(enrollment);
    const { token } = await generateService.execute(enrollment.id, "user-1");

    await expect(checkInService.execute(token, "event-2", "session-1")).rejects.toThrow(
      InvalidCheckInTokenError,
    );
  });

  it("rejects a garbage token", async () => {
    const { checkInService } = build();
    await expect(checkInService.execute("not-a-real-token", "event-1", "session-1")).rejects.toThrow(
      InvalidCheckInTokenError,
    );
  });

  it("rejects a token signed with a different secret (forged)", async () => {
    const { enrollmentRepository, checkInService } = build();
    const enrollment = Enrollment.create("reg-1", "event-1", "user-1", [], true);
    await enrollmentRepository.save(enrollment);
    const forgedSigner = new QrTokenService("b".repeat(32));
    const forgedToken = await forgedSigner.sign(
      { enrollmentId: enrollment.id, eventId: "event-1", userId: "user-1" },
      3600,
    );

    await expect(checkInService.execute(forgedToken, "event-1", "session-1")).rejects.toThrow(
      InvalidCheckInTokenError,
    );
  });
});
