import { DomainError, DomainErrorKind } from '../../../shared/errors/DomainError';

export class EmailAlreadyRegisteredError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'EMAIL_ALREADY_REGISTERED';

  constructor(email: string) {
    super(`Email already registered: ${email}`);
  }
}
