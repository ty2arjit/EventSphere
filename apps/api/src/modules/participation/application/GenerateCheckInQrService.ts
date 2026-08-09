import QRCode from "qrcode";
import type { EnrollmentRepository } from "../domain/EnrollmentRepository";
import { QrTokenService } from "../infrastructure/QrTokenService";
import {
  EnrollmentNotFoundError,
  EnrollmentNotApprovedError,
  EnrollmentAccessDeniedError,
} from "../domain/errors";

const TOKEN_TTL_SECONDS = 12 * 60 * 60; // 12h — long enough to cover a full event day without forcing a reload mid-queue

export interface CheckInQrResult {
  qrCodeDataUrl: string;
  token: string;
  expiresAt: string;
}

export class GenerateCheckInQrService {
  constructor(
    private readonly enrollmentRepository: EnrollmentRepository,
    private readonly qrTokenService: QrTokenService,
  ) {}

  // Self-service only — a participant fetches their own check-in QR.
  // Organizers don't need this (they scan/confirm via CheckInByQrService,
  // gated on participation:manage instead), so ownership is the only
  // check that makes sense here.
  async execute(enrollmentId: string, requesterId: string): Promise<CheckInQrResult> {
    const enrollment = await this.enrollmentRepository.findById(enrollmentId);
    if (!enrollment) throw new EnrollmentNotFoundError(enrollmentId);
    if (enrollment.userId !== requesterId) {
      throw new EnrollmentAccessDeniedError();
    }
    if (enrollment.status !== "Approved") {
      throw new EnrollmentNotApprovedError(enrollmentId);
    }

    const token = await this.qrTokenService.sign(
      { enrollmentId: enrollment.id, eventId: enrollment.eventId, userId: enrollment.userId },
      TOKEN_TTL_SECONDS,
    );

    const qrCodeDataUrl = await QRCode.toDataURL(token, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 320,
    });

    return {
      qrCodeDataUrl,
      token,
      expiresAt: new Date(Date.now() + TOKEN_TTL_SECONDS * 1000).toISOString(),
    };
  }
}
