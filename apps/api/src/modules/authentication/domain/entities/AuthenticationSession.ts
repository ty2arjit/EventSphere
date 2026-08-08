import { SessionExpiredError, SessionRevokedError } from '../errors';

export interface AuthenticationSessionProps {
  id: string;
  userCredentialId: string;
  refreshTokenHash: string;
  deviceLabel: string | null;
  ipAddress: string | null;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
}

/**
 * One active login. Constructed only through the UserCredential aggregate
 * (Constitution Article 13). Refresh tokens are stored as SHA-256 hashes,
 * never plaintext.
 */
export class AuthenticationSession {
  private constructor(private props: AuthenticationSessionProps) {}

  static create(props: AuthenticationSessionProps): AuthenticationSession {
    return new AuthenticationSession(props);
  }

  static fromPersistence(props: AuthenticationSessionProps): AuthenticationSession {
    return new AuthenticationSession(props);
  }

  /**
   * Marks the session revoked. Called explicitly on logout, or as part of
   * rotation (the old session is revoked while a new one is created).
   */
  revoke(at: Date = new Date()): void {
    if (this.props.revokedAt !== null) {
      return; // idempotent — double revocation is a no-op, not an error
    }
    this.props.revokedAt = at;
  }

  /**
   * Verifies the session is still usable. Throws for anything that would
   * make cookies invalid — the caller (Application Service) translates
   * this into a HTTP 401. Never returns a bool: absence of an error is
   * the success signal.
   */
  assertActive(now: Date = new Date()): void {
    if (this.props.revokedAt !== null) {
      throw new SessionRevokedError();
    }
    if (now >= this.props.expiresAt) {
      throw new SessionExpiredError();
    }
  }

  isActive(now: Date = new Date()): boolean {
    return this.props.revokedAt === null && now < this.props.expiresAt;
  }

  get id(): string {
    return this.props.id;
  }
  get userCredentialId(): string {
    return this.props.userCredentialId;
  }
  get refreshTokenHash(): string {
    return this.props.refreshTokenHash;
  }
  get deviceLabel(): string | null {
    return this.props.deviceLabel;
  }
  get ipAddress(): string | null {
    return this.props.ipAddress;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get revokedAt(): Date | null {
    return this.props.revokedAt;
  }
}
