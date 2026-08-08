import { Request, Response, NextFunction } from "express";
import { CreateRegistrationService } from "../../application/CreateRegistrationService";
import { ManageRegistrationService } from "../../application/ManageRegistrationService";
import { EnrollService } from "../../application/EnrollService";
import { AttendanceService } from "../../application/AttendanceService";
import { CertificateService } from "../../application/CertificateService";
import { toRegistrationResponse, toEnrollmentResponse } from "../mappers/ParticipationMapper";

export class ParticipationController {
  constructor(
    private readonly createRegService: CreateRegistrationService,
    private readonly manageRegService: ManageRegistrationService,
    private readonly enrollService: EnrollService,
    private readonly attendanceService: AttendanceService,
    private readonly certificateService: CertificateService,
  ) {}

  // ── Registration ──

  createRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reg = await this.createRegService.execute(req.body.eventId, req.body.approvalStrategy);
      res.status(201).json(toRegistrationResponse(reg));
    } catch (err) { next(err); }
  };

  getRegistrationByEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reg = await this.manageRegService.getByEventId(req.params.eventId as string);
      if (!reg) return res.status(404).json({ message: "No registration for this event" });
      res.json(toRegistrationResponse(reg));
    } catch (err) { next(err); }
  };

  openRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.manageRegService.open(req.params.id as string);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  closeRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.manageRegService.close(req.params.id as string);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  updateRegistration = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config: Record<string, unknown> = {};
      if (req.body.approvalStrategy) config.approvalStrategy = req.body.approvalStrategy;
      if (req.body.window) {
        config.window = {
          opensAt: new Date(req.body.window.opensAt),
          closesAt: new Date(req.body.window.closesAt),
        };
      }
      if (req.body.capacity) config.capacity = req.body.capacity;
      await this.manageRegService.updateConfig(
        req.params.id as string,
        config as Parameters<ManageRegistrationService["updateConfig"]>[1],
      );
      res.status(204).end();
    } catch (err) { next(err); }
  };

  addQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const q = await this.manageRegService.addQuestion(
        req.params.id as string,
        req.body.label,
        req.body.type,
        req.body.required ?? false,
        req.body.options ?? [],
      );
      res.status(201).json(q);
    } catch (err) { next(err); }
  };

  removeQuestion = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.manageRegService.removeQuestion(req.params.id as string, req.params.questionId as string);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  // ── Enrollment ──

  enroll = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enrollment = await this.enrollService.enroll(
        req.body.eventId,
        (req as unknown as Record<string, unknown>).userId as string ?? req.body.userId,
        req.body.responses ?? [],
      );
      res.status(201).json(toEnrollmentResponse(enrollment));
    } catch (err) { next(err); }
  };

  listEnrollmentsByEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const enrollments = await this.enrollService.listByEvent(req.params.eventId as string);
      res.json({ data: enrollments.map(toEnrollmentResponse) });
    } catch (err) { next(err); }
  };

  approveEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.enrollService.approve(req.params.id as string, req.body.reviewerId);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  rejectEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.enrollService.reject(req.params.id as string, req.body.reviewerId);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  cancelEnrollment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.enrollService.cancel(req.params.id as string);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  // ── Attendance ──

  checkIn = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const a = await this.attendanceService.checkIn(
        req.body.enrollmentId,
        req.body.eventId,
        req.body.sessionId,
        req.body.userId,
      );
      res.status(201).json({
        id: a.id,
        status: a.status,
        checkInAt: a.checkInAt?.toISOString(),
      });
    } catch (err) { next(err); }
  };

  checkOut = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.attendanceService.checkOut(req.params.id as string);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  verifyAttendance = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.attendanceService.verify(req.params.id as string, req.body.verifierId);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  listAttendanceBySession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const records = await this.attendanceService.listBySession(req.params.sessionId as string);
      res.json({
        data: records.map((a) => ({
          id: a.id,
          userId: a.userId,
          status: a.status,
          checkInAt: a.checkInAt?.toISOString() ?? null,
          checkOutAt: a.checkOutAt?.toISOString() ?? null,
          verifiedBy: a.verifiedBy,
        })),
      });
    } catch (err) { next(err); }
  };

  // ── Certificate ──

  createCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cert = await this.certificateService.create(
        req.body.enrollmentId,
        req.body.eventId,
        req.body.userId,
      );
      res.status(201).json({
        id: cert.id,
        verificationCode: cert.verificationCode,
        status: cert.status,
      });
    } catch (err) { next(err); }
  };

  issueCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.certificateService.issue(req.params.id as string);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  revokeCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.certificateService.revoke(req.params.id as string, req.body.reason);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  verifyCertificate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cert = await this.certificateService.verify(req.params.code as string);
      if (!cert) return res.status(404).json({ message: "Certificate not found" });
      res.json({
        id: cert.id,
        status: cert.status,
        verificationCode: cert.verificationCode,
        issuedAt: cert.issuedAt?.toISOString() ?? null,
        revokedAt: cert.revokedAt?.toISOString() ?? null,
      });
    } catch (err) { next(err); }
  };

  listCertificatesByEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const certs = await this.certificateService.listByEvent(req.params.eventId as string);
      res.json({
        data: certs.map((c) => ({
          id: c.id,
          userId: c.userId,
          status: c.status,
          verificationCode: c.verificationCode,
          issuedAt: c.issuedAt?.toISOString() ?? null,
        })),
      });
    } catch (err) { next(err); }
  };
}
