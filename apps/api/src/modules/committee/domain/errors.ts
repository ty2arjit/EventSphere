import { DomainError, DomainErrorKind } from "../../../shared/errors/DomainError";

export class CommitteeNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = "NOT_FOUND";
  readonly code = "COMMITTEE_NOT_FOUND";
  constructor(id: string) {
    super(`Committee not found: ${id}`);
  }
}

export class CommitteeAlreadyExistsError extends DomainError {
  readonly kind: DomainErrorKind = "CONFLICT";
  readonly code = "COMMITTEE_ALREADY_EXISTS";
  constructor(eventId: string) {
    super(`A committee already exists for event: ${eventId}`);
  }
}
