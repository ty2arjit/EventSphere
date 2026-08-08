import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/events/DomainEvent';
import { EmailAddress } from './valueObjects/EmailAddress';
import { HashedPassword } from './valueObjects/HashedPassword';
import { PlaintextPassword } from './valueObjects/PlaintextPassword';
import {
  AuthenticationSession,
  AuthenticationSessionProps,
} from './entities/AuthenticationSession';
import {
  AuthenticationProvider,
  AuthenticationProviderProps,
  ProviderName,
} from './entities/AuthenticationProvider';
import {
  VerificationToken,
  VerificationPurpose,
  VerificationTokenProps,
} from './entities/VerificationToken';
import {
  EmailAlreadyVerifiedError,
  InvalidCredentialsError,
  SessionNotFoundError,
  VerificationTokenNotFoundError,
} from './errors';
import { PasswordHasher } from './services/PasswordHasher';
import { credentialRegistered } from './events/CredentialRegistered';
import { emailVerified } from './events/EmailVerified';
import { passwordChanged } from './events/PasswordChanged';
import { sessionStarted } from './events/SessionStarted';
import { sessionRevoked, SessionRevocationReason } from './events/SessionRevoked';

/**
 * Aggregate Root — Authentication Domain (Canonical Architecture
 * Specification §2.1, Ch.20). Owns the credential, its providers, its
 * active sessions, and its outstanding verification tokens. Framework-
 * free (Constitution Article 11).
 *
 * The credential's id is the same string as the User's id in Profile
 * Domain — they are the same identity viewed by different bounded
 * contexts. Nothing else about Profile is imported here (Article 12,
 * bounded context isolation).
 */

interface UserCredentialProps {
  id: string;
  email: EmailAddress;
  hashedPassword: HashedPassword | null;
  emailVerifiedAt: Date | null;
  providers: AuthenticationProvider[];
  sessions: AuthenticationSession[];
  tokens: VerificationToken[];
  createdAt: Date;
  updatedAt: Date;
}

export interface UserCredentialPersistenceProps {
  id: string;
  email: string;
  hashedPassword: string | null;
  emailVerifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  providers: AuthenticationProviderProps[];
  sessions: AuthenticationSessionProps[];
  tokens: VerificationTokenProps[];
}

export class UserCredential {
  private readonly pendingEvents: DomainEvent[] = [];

  private constructor(private readonly props: UserCredentialProps) {}

  /**
   * Constructs a brand new credential for a freshly-registered user.
   * The Application Service is responsible for creating the User in
   * Profile Domain first (via ProfileRepository, in the same transaction)
   * and passing that id in here.
   */
  static register(
    id: string,
    email: EmailAddress,
    hashedPassword: HashedPassword | null,
  ): UserCredential {
    const now = new Date();
    const passwordProvider =
      hashedPassword !== null
        ? [
            AuthenticationProvider.create({
              id: randomUUID(),
              userCredentialId: id,
              provider: 'password',
              providerAccountId: email.value,
              linkedAt: now,
            }),
          ]
        : [];

    const credential = new UserCredential({
      id,
      email,
      hashedPassword,
      emailVerifiedAt: null,
      providers: passwordProvider,
      sessions: [],
      tokens: [],
      createdAt: now,
      updatedAt: now,
    });

    credential.pendingEvents.push(
      credentialRegistered({ userCredentialId: id, email: email.value }),
    );
    return credential;
  }

  static fromPersistence(props: UserCredentialPersistenceProps): UserCredential {
    return new UserCredential({
      id: props.id,
      email: EmailAddress.create(props.email),
      hashedPassword:
        props.hashedPassword !== null ? HashedPassword.fromPersistence(props.hashedPassword) : null,
      emailVerifiedAt: props.emailVerifiedAt,
      providers: props.providers.map(AuthenticationProvider.fromPersistence),
      sessions: props.sessions.map(AuthenticationSession.fromPersistence),
      tokens: props.tokens.map(VerificationToken.fromPersistence),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  pullDomainEvents(): DomainEvent[] {
    return this.pendingEvents.splice(0, this.pendingEvents.length);
  }

  /** Ch.20 "Email Verification" — flips the credential-side flag. Profile syncs via the event. */
  verifyEmail(now: Date = new Date()): void {
    if (this.props.emailVerifiedAt !== null) {
      throw new EmailAlreadyVerifiedError(this.props.id);
    }
    this.props.emailVerifiedAt = now;
    this.touch(now);
    this.pendingEvents.push(
      emailVerified({ userCredentialId: this.props.id, verifiedAt: now.toISOString() }),
    );
  }

  /**
   * Verifies a plaintext password against the stored hash. Async because
   * argon2 verification is CPU-bound; the aggregate awaits the injected
   * PasswordHasher rather than doing the work itself (Article 11).
   *
   * Returns true only if the credential HAS a password (OAuth-only
   * accounts return false) AND the password matches. Callers must never
   * distinguish between the two cases to the outside world (BL-002).
   */
  async attemptPassword(
    plaintext: PlaintextPassword,
    hasher: PasswordHasher,
  ): Promise<boolean> {
    if (this.props.hashedPassword === null) {
      return false;
    }
    return hasher.verify(plaintext, this.props.hashedPassword);
  }

  /**
   * Replaces the stored hash. Revokes every active session except
   * `keepSessionId` (typically the one making the request). If
   * `keepSessionId` is null, all sessions are revoked — this is the
   * password-reset path (the resetting user had no active session).
   */
  changePassword(
    newHash: HashedPassword,
    reason: SessionRevocationReason,
    keepSessionId: string | null,
    now: Date = new Date(),
  ): void {
    this.props.hashedPassword = newHash;
    this.touch(now);
    for (const session of this.props.sessions) {
      if (session.id === keepSessionId || !session.isActive(now)) {
        continue;
      }
      session.revoke(now);
      this.pendingEvents.push(
        sessionRevoked({
          userCredentialId: this.props.id,
          sessionId: session.id,
          reason,
          occurredAt: now.toISOString(),
        }),
      );
    }
    this.pendingEvents.push(
      passwordChanged({ userCredentialId: this.props.id, changedAt: now.toISOString() }),
    );
  }

  /**
   * Records a new session. Called after a successful password
   * authentication or a completed OAuth flow. The raw refresh token
   * has already been generated by the Application Service; the aggregate
   * only sees its hash.
   */
  startSession(
    refreshTokenHash: string,
    expiresAt: Date,
    deviceLabel: string | null,
    ipAddress: string | null,
    now: Date = new Date(),
  ): AuthenticationSession {
    const session = AuthenticationSession.create({
      id: randomUUID(),
      userCredentialId: this.props.id,
      refreshTokenHash,
      deviceLabel,
      ipAddress,
      createdAt: now,
      expiresAt,
      revokedAt: null,
    });
    this.props.sessions.push(session);
    this.touch(now);
    this.pendingEvents.push(
      sessionStarted({
        userCredentialId: this.props.id,
        sessionId: session.id,
        deviceLabel,
        occurredAt: now.toISOString(),
      }),
    );
    return session;
  }

  /**
   * Rotates a refresh token. The old session is revoked and a new one
   * takes its place, so a stolen-but-not-yet-used refresh token becomes
   * useless once the legitimate holder rotates.
   */
  rotateSession(
    oldSessionId: string,
    newRefreshTokenHash: string,
    expiresAt: Date,
    now: Date = new Date(),
  ): AuthenticationSession {
    const old = this.findActiveSessionById(oldSessionId, now);
    old.assertActive(now);
    old.revoke(now);
    this.pendingEvents.push(
      sessionRevoked({
        userCredentialId: this.props.id,
        sessionId: old.id,
        reason: 'logout', // rotation is a soft revoke
        occurredAt: now.toISOString(),
      }),
    );
    return this.startSession(newRefreshTokenHash, expiresAt, old.deviceLabel, old.ipAddress, now);
  }

  /**
   * A refresh-token-reuse detection path. If a rotated (revoked) token
   * is presented again, every session is revoked immediately — the
   * refresh token was almost certainly stolen. Returns nothing; caller
   * emits its own domain event context around the incident.
   */
  revokeAllForTokenReuse(now: Date = new Date()): void {
    for (const session of this.props.sessions) {
      if (!session.isActive(now) && session.revokedAt !== null) continue;
      session.revoke(now);
      this.pendingEvents.push(
        sessionRevoked({
          userCredentialId: this.props.id,
          sessionId: session.id,
          reason: 'refresh_token_reuse_detected',
          occurredAt: now.toISOString(),
        }),
      );
    }
    this.touch(now);
  }

  revokeSession(sessionId: string, reason: SessionRevocationReason, now: Date = new Date()): void {
    const session = this.props.sessions.find((s) => s.id === sessionId);
    if (!session) {
      throw new SessionNotFoundError();
    }
    if (session.revokedAt !== null) return; // idempotent
    session.revoke(now);
    this.touch(now);
    this.pendingEvents.push(
      sessionRevoked({
        userCredentialId: this.props.id,
        sessionId,
        reason,
        occurredAt: now.toISOString(),
      }),
    );
  }

  revokeAllSessions(reason: SessionRevocationReason, now: Date = new Date()): void {
    for (const session of this.props.sessions) {
      if (!session.isActive(now)) continue;
      session.revoke(now);
      this.pendingEvents.push(
        sessionRevoked({
          userCredentialId: this.props.id,
          sessionId: session.id,
          reason,
          occurredAt: now.toISOString(),
        }),
      );
    }
    this.touch(now);
  }

  issueVerificationToken(
    purpose: VerificationPurpose,
    tokenHash: string,
    expiresAt: Date,
    now: Date = new Date(),
  ): VerificationToken {
    const token = VerificationToken.create({
      id: randomUUID(),
      userCredentialId: this.props.id,
      purpose,
      tokenHash,
      createdAt: now,
      expiresAt,
      consumedAt: null,
    });
    this.props.tokens.push(token);
    this.touch(now);
    return token;
  }

  consumeVerificationToken(
    purpose: VerificationPurpose,
    tokenHash: string,
    now: Date = new Date(),
  ): VerificationToken {
    const token = this.props.tokens.find(
      (t) => t.purpose === purpose && t.tokenHash === tokenHash,
    );
    if (!token) {
      throw new VerificationTokenNotFoundError();
    }
    token.consume(now);
    this.touch(now);
    return token;
  }

  findActiveSessionByRefreshTokenHash(
    hash: string,
    now: Date = new Date(),
  ): AuthenticationSession {
    const session = this.props.sessions.find((s) => s.refreshTokenHash === hash);
    if (!session) {
      throw new InvalidCredentialsError();
    }
    session.assertActive(now); // throws on revoked/expired
    return session;
  }

  hasAnySessionWithRefreshTokenHash(hash: string): boolean {
    return this.props.sessions.some((s) => s.refreshTokenHash === hash);
  }

  private findActiveSessionById(id: string, now: Date): AuthenticationSession {
    const session = this.props.sessions.find((s) => s.id === id);
    if (!session) {
      throw new SessionNotFoundError();
    }
    session.assertActive(now);
    return session;
  }

  private touch(at: Date): void {
    this.props.updatedAt = at;
  }

  get id(): string {
    return this.props.id;
  }
  get email(): string {
    return this.props.email.value;
  }
  get emailVerifiedAt(): Date | null {
    return this.props.emailVerifiedAt;
  }
  get hasPassword(): boolean {
    return this.props.hashedPassword !== null;
  }
  get hashedPassword(): HashedPassword | null {
    return this.props.hashedPassword;
  }
  get providers(): readonly AuthenticationProvider[] {
    return this.props.providers;
  }
  get sessions(): readonly AuthenticationSession[] {
    return this.props.sessions;
  }
  get tokens(): readonly VerificationToken[] {
    return this.props.tokens;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  hasProvider(provider: ProviderName): boolean {
    return this.props.providers.some((p) => p.provider === provider);
  }
}
