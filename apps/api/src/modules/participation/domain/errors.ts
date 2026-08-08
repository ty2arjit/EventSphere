export class RegistrationNotFoundError extends Error {
  constructor(id: string) {
    super(`Registration not found: ${id}`);
    this.name = "RegistrationNotFoundError";
  }
}

export class RegistrationAlreadyExistsError extends Error {
  constructor(eventId: string) {
    super(`Registration already exists for event: ${eventId}`);
    this.name = "RegistrationAlreadyExistsError";
  }
}

export class EnrollmentNotFoundError extends Error {
  constructor(id: string) {
    super(`Enrollment not found: ${id}`);
    this.name = "EnrollmentNotFoundError";
  }
}

export class DuplicateEnrollmentError extends Error {
  constructor(userId: string, eventId: string) {
    super(`User ${userId} is already enrolled in event ${eventId}`);
    this.name = "DuplicateEnrollmentError";
  }
}

export class RegistrationClosedError extends Error {
  constructor(eventId: string) {
    super(`Registration is closed for event: ${eventId}`);
    this.name = "RegistrationClosedError";
  }
}
