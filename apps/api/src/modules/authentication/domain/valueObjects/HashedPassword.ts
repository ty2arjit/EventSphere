import { DomainError, DomainErrorKind } from '../../../../shared/errors/DomainError';

class InvalidHashedPasswordError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVALID_HASHED_PASSWORD';

  constructor(message: string) {
    super(message);
  }
}

/**
 * Persisted format: `<algorithm>$<hash>`. The algorithm prefix satisfies
 * Ch.20's "hashing algorithms should be upgradeable without changing
 * business logic" — a future algorithm rotation writes a new prefix; old
 * hashes verify with the algorithm named in their own prefix.
 *
 * The actual hashing lives in Infrastructure (PasswordHasher interface);
 * this VO knows only how to serialize and split the format.
 */
export type HashAlgorithm = 'argon2id';

export class HashedPassword {
  private constructor(
    readonly algorithm: HashAlgorithm,
    readonly hash: string,
  ) {}

  static create(algorithm: HashAlgorithm, hash: string): HashedPassword {
    if (hash.length === 0) {
      throw new InvalidHashedPasswordError('Hash cannot be empty');
    }
    return new HashedPassword(algorithm, hash);
  }

  static fromPersistence(serialized: string): HashedPassword {
    const separatorIndex = serialized.indexOf('$');
    if (separatorIndex < 0) {
      throw new InvalidHashedPasswordError(
        'Serialized hashed password must be "<algorithm>$<hash>"',
      );
    }
    const algorithm = serialized.slice(0, separatorIndex) as HashAlgorithm;
    const hash = serialized.slice(separatorIndex + 1);
    if (algorithm !== 'argon2id') {
      throw new InvalidHashedPasswordError(`Unknown hash algorithm: ${algorithm}`);
    }
    if (hash.length === 0) {
      throw new InvalidHashedPasswordError('Hash portion is empty');
    }
    return new HashedPassword(algorithm, hash);
  }

  serialize(): string {
    return `${this.algorithm}$${this.hash}`;
  }
}
