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

export class InvalidAvatarUrlError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVALID_AVATAR_URL';

  constructor(url: string) {
    super(`Invalid avatar URL: ${url}`);
  }
}

export class InvalidProfileFieldError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVALID_PROFILE_FIELD';

  constructor(message: string) {
    super(message);
  }
}

export class InvalidPreferencesError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVALID_PREFERENCES';

  constructor(message: string) {
    super(message);
  }
}

export class AlreadyVerifiedError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'ALREADY_VERIFIED';

  constructor(userId: string) {
    super(`User ${userId} is already verified`);
  }
}

export class InvalidLifecycleTransitionError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVALID_LIFECYCLE_TRANSITION';

  constructor(from: string, to: string) {
    super(`Cannot transition from '${from}' to '${to}'`);
  }
}
