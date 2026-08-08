/**
 * Cryptographically strong random token generator. Yields URL-safe
 * strings suitable for use in verification/reset links and refresh
 * tokens. The raw token is transmitted to the user and never persisted
 * — only its hash is stored (via TokenHasher).
 */
export interface RandomTokenGenerator {
  generate(): string;
}
