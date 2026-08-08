import { VerificationPurpose } from './entities/VerificationToken';
import { UserCredential } from './UserCredential';

/**
 * One repository per aggregate (Constitution Article 26). Write paths
 * are deliberately narrow — each Application Service persists only the
 * child table(s) it actually changed, mirroring the pattern established
 * in Profile Domain.
 */
export interface UserCredentialRepository {
  findById(id: string): Promise<UserCredential | null>;
  findByEmail(email: string): Promise<UserCredential | null>;
  findByRefreshTokenHash(hash: string): Promise<UserCredential | null>;
  findByVerificationTokenHash(
    purpose: VerificationPurpose,
    hash: string,
  ): Promise<UserCredential | null>;
  /** Insert path — registration only. Creates credential + provider rows atomically. */
  save(credential: UserCredential): Promise<void>;
  /** Updates the credential row (hashedPassword, emailVerifiedAt) + updatedAt. */
  updateCredential(credential: UserCredential): Promise<void>;
  /** Persists session inserts, rotations, and revocations. */
  updateSessions(credential: UserCredential): Promise<void>;
  /** Persists verification token inserts and consumptions. */
  updateTokens(credential: UserCredential): Promise<void>;
}
