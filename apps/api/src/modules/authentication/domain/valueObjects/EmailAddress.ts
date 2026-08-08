import { DomainError, DomainErrorKind } from '../../../../shared/errors/DomainError';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class InvalidEmailAddressError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVALID_EMAIL_ADDRESS';

  constructor(email: string) {
    super(`Invalid email address: ${email}`);
  }
}

/**
 * Authentication Domain's own email VO — deliberately not shared with
 * Profile's Email VO (Constitution Article 12, Bounded Context Isolation).
 * Each context normalizes its own inputs at its own boundary.
 *
 * Uses the same normalization rules as Profile so the two representations
 * of the same address are always byte-equal.
 */
export class EmailAddress {
  private constructor(private readonly _value: string) {}

  static create(raw: string): EmailAddress {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailAddressError(raw);
    }
    return new EmailAddress(normalized);
  }

  get value(): string {
    return this._value;
  }

  equals(other: EmailAddress): boolean {
    return this._value === other._value;
  }
}
