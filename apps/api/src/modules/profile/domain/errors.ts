import { DomainError, DomainErrorKind } from '../../../shared/errors/DomainError';

export class InvalidEmailError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVALID_EMAIL';

  constructor(email: string) {
    super(`Invalid email address: ${email}`);
  }
}

export class InvalidNameError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVALID_NAME';

  constructor() {
    super('Name must not be empty');
  }
}
