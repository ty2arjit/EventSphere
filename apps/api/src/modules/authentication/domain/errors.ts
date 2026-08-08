import { DomainError, DomainErrorKind } from '../../../shared/errors/DomainError';

export class WeakPasswordError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'WEAK_PASSWORD';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Generic — deliberately does NOT distinguish "user not found" from
 * "wrong password" (TECHNICAL_BACKLOG.md BL-002 mitigation, Ch.20
 * Security Principles).
 */
export class InvalidCredentialsError extends DomainError {
  readonly kind: DomainErrorKind = 'UNAUTHORIZED';
  readonly code = 'INVALID_CREDENTIALS';

  constructor() {
    super('Invalid email or password');
  }
}

export class EmailAlreadyVerifiedError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'EMAIL_ALREADY_VERIFIED';

  constructor(userCredentialId: string) {
    super(`Email is already verified for user ${userCredentialId}`);
  }
}

export class VerificationTokenNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'VERIFICATION_TOKEN_NOT_FOUND';

  constructor() {
    super('Verification token not found');
  }
}

export class VerificationTokenExpiredError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'VERIFICATION_TOKEN_EXPIRED';

  constructor() {
    super('Verification token has expired');
  }
}

export class VerificationTokenAlreadyConsumedError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'VERIFICATION_TOKEN_ALREADY_CONSUMED';

  constructor() {
    super('Verification token has already been used');
  }
}

export class SessionNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'SESSION_NOT_FOUND';

  constructor() {
    super('Session not found');
  }
}

export class SessionExpiredError extends DomainError {
  readonly kind: DomainErrorKind = 'UNAUTHORIZED';
  readonly code = 'SESSION_EXPIRED';

  constructor() {
    super('Session has expired');
  }
}

export class SessionRevokedError extends DomainError {
  readonly kind: DomainErrorKind = 'UNAUTHORIZED';
  readonly code = 'SESSION_REVOKED';

  constructor() {
    super('Session has been revoked');
  }
}
