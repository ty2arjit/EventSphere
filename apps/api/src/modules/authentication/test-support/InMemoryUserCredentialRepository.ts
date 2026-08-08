import { UserCredential } from '../domain/UserCredential';
import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { VerificationPurpose } from '../domain/entities/VerificationToken';

/**
 * Test double — matches PrismaUserCredentialRepository's contract but
 * holds everything in memory. Every save/update method stores a fresh
 * reference to the same aggregate instance; there's no snapshot copying,
 * because tests always run within a single Node process where mutation
 * visibility isn't a concern.
 */
export class InMemoryUserCredentialRepository implements UserCredentialRepository {
  private readonly byId = new Map<string, UserCredential>();

  async findById(id: string): Promise<UserCredential | null> {
    return this.byId.get(id) ?? null;
  }

  async findByEmail(email: string): Promise<UserCredential | null> {
    for (const cred of this.byId.values()) {
      if (cred.email === email) return cred;
    }
    return null;
  }

  async findByRefreshTokenHash(hash: string): Promise<UserCredential | null> {
    for (const cred of this.byId.values()) {
      if (cred.hasAnySessionWithRefreshTokenHash(hash)) return cred;
    }
    return null;
  }

  async findByVerificationTokenHash(
    purpose: VerificationPurpose,
    hash: string,
  ): Promise<UserCredential | null> {
    for (const cred of this.byId.values()) {
      const has = cred.tokens.some((t) => t.purpose === purpose && t.tokenHash === hash);
      if (has) return cred;
    }
    return null;
  }

  async save(credential: UserCredential): Promise<void> {
    this.byId.set(credential.id, credential);
  }

  async updateCredential(credential: UserCredential): Promise<void> {
    this.byId.set(credential.id, credential);
  }

  async updateSessions(credential: UserCredential): Promise<void> {
    this.byId.set(credential.id, credential);
  }

  async updateTokens(credential: UserCredential): Promise<void> {
    this.byId.set(credential.id, credential);
  }
}
