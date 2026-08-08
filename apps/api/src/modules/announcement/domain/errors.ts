import { DomainError, DomainErrorKind } from "../../../shared/errors/DomainError";

export class AnnouncementNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = "NOT_FOUND";
  readonly code = "ANNOUNCEMENT_NOT_FOUND";
  constructor(id: string) {
    super(`Announcement not found: ${id}`);
  }
}
