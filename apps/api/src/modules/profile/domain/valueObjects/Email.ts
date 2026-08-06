import { InvalidEmailError } from '../errors';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Value Object — Profile Domain (Canonical Architecture Specification,
 * Section 2.1, amended to include Email). Single source of truth for email
 * normalization and format validation (Constitution Article 6) — this used
 * to be duplicated between User.register() and RegisterProfileService
 * (TECHNICAL_BACKLOG.md BL-001).
 */
export class Email {
  private constructor(private readonly _value: string) {}

  static create(raw: string): Email {
    const normalized = raw.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalized)) {
      throw new InvalidEmailError(raw);
    }
    return new Email(normalized);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    return this._value === other._value;
  }
}
