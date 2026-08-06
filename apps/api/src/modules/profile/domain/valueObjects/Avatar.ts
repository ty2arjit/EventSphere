import { InvalidAvatarUrlError } from '../errors';

const URL_PATTERN = /^https?:\/\/.+/i;

/**
 * Value Object — Profile Domain (Canonical Architecture Specification,
 * Section 2.1). Wraps a URL string only — no file-upload/storage semantics.
 * Ch.19 describes Avatar purely as a Value Object with no described upload
 * mechanics, so this stays scoped to identity/profile data modeling; file
 * storage infrastructure is a separate decision if it's ever needed.
 */
export class Avatar {
  private constructor(private readonly _url: string | null) {}

  static create(raw: string | null | undefined): Avatar {
    if (raw === null || raw === undefined || raw.trim().length === 0) {
      return new Avatar(null);
    }
    const trimmed = raw.trim();
    if (!URL_PATTERN.test(trimmed)) {
      throw new InvalidAvatarUrlError(trimmed);
    }
    return new Avatar(trimmed);
  }

  static empty(): Avatar {
    return new Avatar(null);
  }

  get url(): string | null {
    return this._url;
  }

  equals(other: Avatar): boolean {
    return this._url === other._url;
  }
}
