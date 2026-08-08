import { DomainError, DomainErrorKind } from '../../../shared/errors/DomainError';

/**
 * Only surfaced in test/dev flows — never returned to unauthenticated
 * callers, because a public error that distinguishes "email taken" from
 * "email new" reintroduces the enumeration leak BL-002 addresses.
 */
export class EmailAlreadyRegisteredError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'EMAIL_ALREADY_REGISTERED';

  constructor(email: string) {
    super(`Email already registered: ${email}`);
  }
}
