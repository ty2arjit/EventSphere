import { DomainError, DomainErrorKind } from "../../../shared/errors/DomainError";

export class TaskNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = "NOT_FOUND";
  readonly code = "TASK_NOT_FOUND";
  constructor(id: string) {
    super(`Task not found: ${id}`);
  }
}
