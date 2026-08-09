import { DomainError, DomainErrorKind } from "../../../shared/errors/DomainError";

export class RegistrationNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = "NOT_FOUND";
  readonly code = "REGISTRATION_NOT_FOUND";
  constructor(id: string) {
    super(`Registration not found: ${id}`);
  }
}

export class RegistrationAlreadyExistsError extends DomainError {
  readonly kind: DomainErrorKind = "CONFLICT";
  readonly code = "REGISTRATION_ALREADY_EXISTS";
  constructor(eventId: string) {
    super(`Registration already exists for event: ${eventId}`);
  }
}

export class EnrollmentNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = "NOT_FOUND";
  readonly code = "ENROLLMENT_NOT_FOUND";
  constructor(id: string) {
    super(`Enrollment not found: ${id}`);
  }
}

export class AttendanceNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = "NOT_FOUND";
  readonly code = "ATTENDANCE_NOT_FOUND";
  constructor(id: string) {
    super(`Attendance record not found: ${id}`);
  }
}

export class CertificateNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = "NOT_FOUND";
  readonly code = "CERTIFICATE_NOT_FOUND";
  constructor(id: string) {
    super(`Certificate not found: ${id}`);
  }
}

export class DuplicateEnrollmentError extends DomainError {
  readonly kind: DomainErrorKind = "CONFLICT";
  readonly code = "DUPLICATE_ENROLLMENT";
  constructor(userId: string, eventId: string) {
    super(`User ${userId} is already enrolled in event ${eventId}`);
  }
}

export class RegistrationClosedError extends DomainError {
  readonly kind: DomainErrorKind = "VALIDATION";
  readonly code = "REGISTRATION_CLOSED";
  constructor(eventId: string) {
    super(`Registration is closed for event: ${eventId}`);
  }
}

export class EnrollmentAccessDeniedError extends DomainError {
  readonly kind: DomainErrorKind = "FORBIDDEN";
  readonly code = "ENROLLMENT_ACCESS_DENIED";
  constructor() {
    super("You can only cancel your own enrollment");
  }
}
