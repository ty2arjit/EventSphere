import { InvalidNameError } from '../errors';

/**
 * Value Object — Profile Domain (Canonical Architecture Specification,
 * Section 2.1). Single source of truth for name validation, previously
 * inlined directly in User.register().
 */
export class FullName {
  private constructor(private readonly _value: string) {}

  static create(raw: string): FullName {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      throw new InvalidNameError();
    }
    return new FullName(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: FullName): boolean {
    return this._value === other._value;
  }
}
