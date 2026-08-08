import { HashedPassword } from '../domain/valueObjects/HashedPassword';
import { PlaintextPassword } from '../domain/valueObjects/PlaintextPassword';
import { PasswordHasher } from '../domain/services/PasswordHasher';
import { TokenHasher } from '../domain/services/TokenHasher';
import { RandomTokenGenerator } from '../domain/services/RandomTokenGenerator';
import { Mailer } from '../infrastructure/Mailer';
import { JwtService, AccessTokenClaims } from '../infrastructure/JoseJwtService';
import { ProfileGateway } from '../application/ProfileGateway';

/**
 * Fast, deterministic fakes for application-layer tests. None of these
 * touch real crypto or IO — the aggregate's behaviour under each is what
 * we're testing, not the underlying algorithms (those are covered in
 * separate infrastructure tests).
 */
export class FakePasswordHasher implements PasswordHasher {
  async hash(plaintext: PlaintextPassword): Promise<HashedPassword> {
    return HashedPassword.create('argon2id', `hashed(${plaintext.reveal()})`);
  }
  async verify(plaintext: PlaintextPassword, hashed: HashedPassword): Promise<boolean> {
    return hashed.hash === `hashed(${plaintext.reveal()})`;
  }
}

export class FakeTokenHasher implements TokenHasher {
  hash(rawToken: string): string {
    return `hashed:${rawToken}`;
  }
}

/**
 * Returns a monotonically-increasing counter as a token so tests can
 * assert "the token was rotated" without doing string equality on
 * random values.
 */
export class SequentialTokenGenerator implements RandomTokenGenerator {
  private counter = 0;
  generate(): string {
    this.counter += 1;
    return `token-${this.counter}`;
  }
}

export class RecordingMailer implements Mailer {
  readonly sent: Array<
    { kind: 'verify'; to: string; link: string } | { kind: 'reset'; to: string; link: string }
  > = [];

  async sendVerificationEmail(to: string, link: string): Promise<void> {
    this.sent.push({ kind: 'verify', to, link });
  }
  async sendPasswordResetEmail(to: string, link: string): Promise<void> {
    this.sent.push({ kind: 'reset', to, link });
  }
}

export class FakeJwtService implements JwtService {
  async issueAccessToken(claims: AccessTokenClaims, ttlSeconds: number): Promise<string> {
    return `access:${claims.sub}:${claims.sessionId}:${ttlSeconds}`;
  }
  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    const parts = token.split(':');
    if (parts[0] !== 'access' || parts.length < 4) {
      throw new Error('Invalid token');
    }
    return { sub: parts[1]!, sessionId: parts[2]!, emailVerified: false };
  }
}

/**
 * In-memory ProfileGateway. Records createProfile calls and can be seeded
 * with existing users to simulate the "email already registered" path.
 */
export class InMemoryProfileGateway implements ProfileGateway {
  private readonly idsByEmail = new Map<string, string>();
  readonly createdProfiles: Array<{ userId: string; email: string; name: string }> = [];

  seed(email: string, userId: string): void {
    this.idsByEmail.set(email, userId);
  }

  async createProfile(input: { email: string; name: string }): Promise<{ userId: string }> {
    const userId = `user-${this.idsByEmail.size + 1}-${input.email}`;
    this.idsByEmail.set(input.email, userId);
    this.createdProfiles.push({ userId, email: input.email, name: input.name });
    return { userId };
  }

  async findUserIdByEmail(email: string): Promise<string | null> {
    return this.idsByEmail.get(email) ?? null;
  }
}
