import {
  VerificationTokenAlreadyConsumedError,
  VerificationTokenExpiredError,
} from '../errors';

export type VerificationPurpose = 'email_verification' | 'password_reset';

export interface VerificationTokenProps {
  id: string;
  userCredentialId: string;
  purpose: VerificationPurpose;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  consumedAt: Date | null;
}

/**
 * Single-use token used for email verification and password reset. The raw
 * token is generated in the Application Service (via RandomTokenGenerator),
 * emailed to the user, and never persisted — only its SHA-256 hash is
 * stored here. Consumption is one-shot: a consumed token cannot be reused,
 * even before its expiry.
 */
export class VerificationToken {
  private constructor(private props: VerificationTokenProps) {}

  static create(props: VerificationTokenProps): VerificationToken {
    return new VerificationToken(props);
  }

  static fromPersistence(props: VerificationTokenProps): VerificationToken {
    return new VerificationToken(props);
  }

  consume(now: Date = new Date()): void {
    if (this.props.consumedAt !== null) {
      throw new VerificationTokenAlreadyConsumedError();
    }
    if (now >= this.props.expiresAt) {
      throw new VerificationTokenExpiredError();
    }
    this.props.consumedAt = now;
  }

  get id(): string {
    return this.props.id;
  }
  get userCredentialId(): string {
    return this.props.userCredentialId;
  }
  get purpose(): VerificationPurpose {
    return this.props.purpose;
  }
  get tokenHash(): string {
    return this.props.tokenHash;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get expiresAt(): Date {
    return this.props.expiresAt;
  }
  get consumedAt(): Date | null {
    return this.props.consumedAt;
  }
}
