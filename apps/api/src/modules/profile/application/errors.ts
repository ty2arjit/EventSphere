import { DomainError, DomainErrorKind } from '../../../shared/errors/DomainError';

export class EmailAlreadyRegisteredError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'EMAIL_ALREADY_REGISTERED';

  constructor(email: string) {
    super(`Email already registered: ${email}`);
  }
}

/**
 * Thrown by the Application layer (not the aggregate) because it's the
 * Application Service that decides "not found" by querying the repository —
 * the aggregate itself has no concept of records that don't exist.
 */
export class ProfileNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'PROFILE_NOT_FOUND';

  constructor(id: string) {
    super(`Profile not found: ${id}`);
  }
}
