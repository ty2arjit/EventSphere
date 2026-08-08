import { Router } from "express";
import type { RegistrationRepository } from "../../domain/RegistrationRepository";
import type { EnrollmentRepository } from "../../domain/EnrollmentRepository";
import type { AttendanceRepository } from "../../domain/AttendanceRepository";
import type { CertificateRepository } from "../../domain/CertificateRepository";
import type { EventPublisher } from "../../../../shared/events/EventPublisher";
import { CreateRegistrationService } from "../../application/CreateRegistrationService";
import { ManageRegistrationService } from "../../application/ManageRegistrationService";
import { EnrollService } from "../../application/EnrollService";
import { AttendanceService } from "../../application/AttendanceService";
import { CertificateService } from "../../application/CertificateService";
import { ParticipationController } from "../controllers/ParticipationController";
import { requireAuth } from "../../../authentication/api/middleware/requireAuth";
import {
  validateCreateRegistration,
  validateUpdateRegistration,
  validateAddQuestion,
  validateEnroll,
  validateReview,
} from "../validators/participation.validators";

export interface ParticipationRouterDependencies {
  registrationRepository: RegistrationRepository;
  enrollmentRepository: EnrollmentRepository;
  attendanceRepository: AttendanceRepository;
  certificateRepository: CertificateRepository;
  eventPublisher: EventPublisher;
}

export function createParticipationRouter(deps: ParticipationRouterDependencies): Router {
  const attendanceService = new AttendanceService(deps.attendanceRepository, deps.eventPublisher);
  const certificateService = new CertificateService(deps.certificateRepository, deps.eventPublisher);

  const controller = new ParticipationController(
    new CreateRegistrationService(deps.registrationRepository, deps.eventPublisher),
    new ManageRegistrationService(deps.registrationRepository, deps.eventPublisher),
    new EnrollService(deps.registrationRepository, deps.enrollmentRepository, deps.eventPublisher),
    attendanceService,
    certificateService,
  );

  const router = Router();

  // Registration management
  router.get("/registrations/event/:eventId", controller.getRegistrationByEvent);
  router.post("/registrations", requireAuth, validateCreateRegistration, controller.createRegistration);
  router.patch("/registrations/:id", requireAuth, validateUpdateRegistration, controller.updateRegistration);
  router.post("/registrations/:id/open", requireAuth, controller.openRegistration);
  router.post("/registrations/:id/close", requireAuth, controller.closeRegistration);
  router.post("/registrations/:id/questions", requireAuth, validateAddQuestion, controller.addQuestion);
  router.delete("/registrations/:id/questions/:questionId", requireAuth, controller.removeQuestion);

  // Enrollment
  router.post("/enrollments", requireAuth, validateEnroll, controller.enroll);
  router.get("/enrollments/event/:eventId", controller.listEnrollmentsByEvent);
  router.post("/enrollments/:id/approve", requireAuth, validateReview, controller.approveEnrollment);
  router.post("/enrollments/:id/reject", requireAuth, validateReview, controller.rejectEnrollment);
  router.post("/enrollments/:id/cancel", requireAuth, controller.cancelEnrollment);

  // Attendance
  router.post("/attendance/check-in", requireAuth, controller.checkIn);
  router.post("/attendance/:id/check-out", requireAuth, controller.checkOut);
  router.post("/attendance/:id/verify", requireAuth, controller.verifyAttendance);
  router.get("/attendance/session/:sessionId", controller.listAttendanceBySession);

  // Certificate
  router.post("/certificates", requireAuth, controller.createCertificate);
  router.post("/certificates/:id/issue", requireAuth, controller.issueCertificate);
  router.post("/certificates/:id/revoke", requireAuth, controller.revokeCertificate);
  router.get("/certificates/verify/:code", controller.verifyCertificate);
  router.get("/certificates/event/:eventId", controller.listCertificatesByEvent);

  return router;
}
