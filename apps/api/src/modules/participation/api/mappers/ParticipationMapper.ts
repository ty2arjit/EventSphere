import type { Registration } from "../../domain/Registration";
import type { Enrollment } from "../../domain/Enrollment";
import type { RegistrationResponseDto, EnrollmentResponseDto } from "../dto/ParticipationDtos";

export function toRegistrationResponse(r: Registration): RegistrationResponseDto {
  return {
    id: r.id,
    eventId: r.eventId,
    approvalStrategy: r.approvalStrategy,
    window: r.window
      ? { opensAt: r.window.opensAt.toISOString(), closesAt: r.window.closesAt.toISOString() }
      : null,
    capacity: r.capacity,
    questions: r.questions,
    isOpen: r.isOpen,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

export function toEnrollmentResponse(e: Enrollment): EnrollmentResponseDto {
  return {
    id: e.id,
    registrationId: e.registrationId,
    eventId: e.eventId,
    userId: e.userId,
    status: e.status,
    responses: e.responses,
    reviewedBy: e.reviewedBy,
    reviewedAt: e.reviewedAt?.toISOString() ?? null,
    createdAt: e.createdAt.toISOString(),
    updatedAt: e.updatedAt.toISOString(),
  };
}
