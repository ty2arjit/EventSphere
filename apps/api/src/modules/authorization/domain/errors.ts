import { DomainError, DomainErrorKind } from '../../../shared/errors/DomainError';

export class PermissionNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'PERMISSION_NOT_FOUND';
  constructor(id: string) {
    super(`Permission not found: ${id}`);
  }
}

export class PermissionAlreadyExistsError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'PERMISSION_ALREADY_EXISTS';
  constructor(name: string) {
    super(`Permission already exists: ${name}`);
  }
}

export class GrantNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'GRANT_NOT_FOUND';
  constructor(id: string) {
    super(`Permission grant not found: ${id}`);
  }
}

export class AccessDeniedError extends DomainError {
  readonly kind: DomainErrorKind = 'FORBIDDEN';
  readonly code = 'ACCESS_DENIED';
  constructor() {
    super('Access denied');
  }
}
