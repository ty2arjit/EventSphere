import type { Attendance } from "../domain/Attendance";
import { AttendanceService } from "./AttendanceService";
import { QrTokenService } from "../infrastructure/QrTokenService";
import { InvalidCheckInTokenError } from "../domain/errors";

/**
 * Organizer-facing check-in: verifies the signed token from a
 * participant's QR code (or a hardware scanner / pasted-code fallback —
 * see the frontend, which treats any input event on a focused field the
 * same way) and, only if it's authentic and unexpired, delegates to the
 * existing AttendanceService.checkIn. The caller (route middleware)
 * still separately confirms the organizer has participation:manage on
 * the event the token claims to belong to — this service only answers
 * "is this token real", not "is the caller allowed to use it".
 */
export class CheckInByQrService {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly qrTokenService: QrTokenService,
  ) {}

  async execute(rawToken: string, expectedEventId: string, sessionId: string): Promise<Attendance> {
    let claims;
    try {
      claims = await this.qrTokenService.verify(rawToken);
    } catch {
      throw new InvalidCheckInTokenError();
    }

    if (claims.eventId !== expectedEventId) {
      throw new InvalidCheckInTokenError();
    }

    return this.attendanceService.checkIn(claims.enrollmentId, claims.eventId, sessionId, claims.userId);
  }
}
