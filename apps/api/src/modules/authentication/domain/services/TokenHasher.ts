/**
 * One-way hash for refresh tokens and verification tokens. Deliberately
 * fast (SHA-256 in infrastructure) because these tokens are already
 * high-entropy random bytes — argon2-style stretching would only slow
 * verification without adding security. Distinct from PasswordHasher
 * (which is intentionally slow) so the two are never confused.
 */
export interface TokenHasher {
  hash(rawToken: string): string;
}
