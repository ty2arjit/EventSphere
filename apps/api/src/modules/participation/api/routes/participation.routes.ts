import { Router } from "express";
import type { RegistrationRepository } from "../../domain/RegistrationRepository";
import type { EnrollmentRepository } from "../../domain/EnrollmentRepository";
import type { AttendanceRepository } from "../../domain/AttendanceRepository";
import type { CertificateRepository } from "../../domain/CertificateRepository";
import type { EventRepository } from "../../../event-management/domain/EventRepository";
import type { EventPublisher } from "../../../../shared/events/EventPublisher";
import { RegistrationNotFoundError, EnrollmentNotFoundError, AttendanceNotFoundError, CertificateNotFoundError } from "../../domain/errors";
import { CreateRegistrationService } from "../../application/CreateRegistrationService";
import { ManageRegistrationService } from "../../application/ManageRegistrationService";
import { EnrollService } from "../../application/EnrollService";
import { AttendanceService } from "../../application/AttendanceService";
import { CertificateService } from "../../application/CertificateService";
import { ParticipationController } from "../controllers/ParticipationController";
import { requireAuth } from "../../../authentication/api/middleware/requireAuth";
import { requireResourcePermission } from "../../../authorization/api/middleware/requirePermission";
import { AuthorizeResourceActionService } from "../../../authorization/application/AuthorizeResourceActionService";
import { resolveEventCommunityId } from "../../../authorization/application/resolveEventContext";
import { PERMISSIONS } from "../../../authorization/domain/permissionNames";
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
  eventRepository: EventRepository;
  eventPublisher: EventPublisher;
  authorizeService: AuthorizeResourceActionService;
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

  const requireManageByEventId = (getEventId: (req: import("express").Request) => string) =>
    requireResourcePermission(deps.authorizeService, PERMISSIONS.PARTICIPATION_MANAGE, async (req) => {
      const eventId = getEventId(req);
      return { communityId: await resolveEventCommunityId(deps.eventRepository, eventId), eventId };
    });

  const requireManageByRegistrationId = requireResourcePermission(
    deps.authorizeService,
    PERMISSIONS.PARTICIPATION_MANAGE,
    async (req) => {
      const registration = await deps.registrationRepository.findById(req.params.id as string);
      if (!registration) throw new RegistrationNotFoundError(req.params.id as string);
      return {
        communityId: await resolveEventCommunityId(deps.eventRepository, registration.eventId),
        eventId: registration.eventId,
      };
    },
  );

  const requireManageByEnrollmentId = requireResourcePermission(
    deps.authorizeService,
    PERMISSIONS.PARTICIPATION_MANAGE,
    async (req) => {
      const enrollment = await deps.enrollmentRepository.findById(req.params.id as string);
      if (!enrollment) throw new EnrollmentNotFoundError(req.params.id as string);
      return {
        communityId: await resolveEventCommunityId(deps.eventRepository, enrollment.eventId),
        eventId: enrollment.eventId,
      };
    },
  );

  const requireManageByAttendanceId = requireResourcePermission(
    deps.authorizeService,
    PERMISSIONS.PARTICIPATION_MANAGE,
    async (req) => {
      const attendance = await deps.attendanceRepository.findById(req.params.id as string);
      if (!attendance) throw new AttendanceNotFoundError(req.params.id as string);
      return {
        communityId: await resolveEventCommunityId(deps.eventRepository, attendance.eventId),
        eventId: attendance.eventId,
      };
    },
  );

  const requireManageByCertificateId = requireResourcePermission(
    deps.authorizeService,
    PERMISSIONS.PARTICIPATION_MANAGE,
    async (req) => {
      const cert = await deps.certificateRepository.findById(req.params.id as string);
      if (!cert) throw new CertificateNotFoundError(req.params.id as string);
      return {
        communityId: await resolveEventCommunityId(deps.eventRepository, cert.eventId),
        eventId: cert.eventId,
      };
    },
  );

  const router = Router();

  // Registration management — organizer-only
  router.get("/registrations/event/:eventId", controller.getRegistrationByEvent);
  router.post(
    "/registrations",
    requireAuth,
    validateCreateRegistration,
    requireManageByEventId((req) => req.body.eventId as string),
    controller.createRegistration,
  );
  router.patch("/registrations/:id", requireAuth, validateUpdateRegistration, requireManageByRegistrationId, controller.updateRegistration);
  router.post("/registrations/:id/open", requireAuth, requireManageByRegistrationId, controller.openRegistration);
  router.post("/registrations/:id/close", requireAuth, requireManageByRegistrationId, controller.closeRegistration);
  router.post("/registrations/:id/questions", requireAuth, validateAddQuestion, requireManageByRegistrationId, controller.addQuestion);
  router.delete("/registrations/:id/questions/:questionId", requireAuth, requireManageByRegistrationId, controller.removeQuestion);

  // Enrollment — enroll/cancel are participant self-service, approve/reject are organizer actions
  router.post("/enrollments", requireAuth, validateEnroll, controller.enroll);
  router.get("/enrollments/event/:eventId", controller.listEnrollmentsByEvent);
  router.post("/enrollments/:id/approve", requireAuth, validateReview, requireManageByEnrollmentId, controller.approveEnrollment);
  router.post("/enrollments/:id/reject", requireAuth, validateReview, requireManageByEnrollmentId, controller.rejectEnrollment);
  router.post("/enrollments/:id/cancel", requireAuth, controller.cancelEnrollment);

  // Attendance — check-in identifies the event directly; check-out/verify are organizer actions
  router.post(
    "/attendance/check-in",
    requireAuth,
    requireManageByEventId((req) => req.body.eventId as string),
    controller.checkIn,
  );
  router.post("/attendance/:id/check-out", requireAuth, requireManageByAttendanceId, controller.checkOut);
  router.post("/attendance/:id/verify", requireAuth, requireManageByAttendanceId, controller.verifyAttendance);
  router.get("/attendance/session/:sessionId", controller.listAttendanceBySession);

  // Certificate — organizer-only
  router.post(
    "/certificates",
    requireAuth,
    requireManageByEventId((req) => req.body.eventId as string),
    controller.createCertificate,
  );
  router.post("/certificates/:id/issue", requireAuth, requireManageByCertificateId, controller.issueCertificate);
  router.post("/certificates/:id/revoke", requireAuth, requireManageByCertificateId, controller.revokeCertificate);
  router.get("/certificates/verify/:code", controller.verifyCertificate);
  router.get("/certificates/event/:eventId", controller.listCertificatesByEvent);

  return router;
}
