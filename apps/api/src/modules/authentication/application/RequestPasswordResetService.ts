import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { EmailAddress } from '../domain/valueObjects/EmailAddress';
import { TokenHasher } from '../domain/services/TokenHasher';
import { RandomTokenGenerator } from '../domain/services/RandomTokenGenerator';
import { Mailer } from '../infrastructure/Mailer';
import { AuthConfig } from './AuthConfig';

/**
 * Idempotent — never leaks whether the email exists (BL-002). If the
 * email is known, issues a token and sends the reset email; if not,
 * quietly does nothing. Rate-limited at the API layer.
 */
export class RequestPasswordResetService {
  constructor(
    private readonly credentialRepository: UserCredentialRepository,
    private readonly tokenHasher: TokenHasher,
    private readonly tokenGenerator: RandomTokenGenerator,
    private readonly mailer: Mailer,
    private readonly config: AuthConfig,
  ) {}

  async execute(rawEmail: string): Promise<void> {
    let email;
    try {
      email = EmailAddress.create(rawEmail);
    } catch {
      return; // malformed email → same as unknown, silently succeed
    }

    const credential = await this.credentialRepository.findByEmail(email.value);
    if (!credential) {
      return;
    }
    if (!credential.hasPassword) {
      // OAuth-only account — reset wouldn't do anything, quietly skip
      return;
    }

    const raw = this.tokenGenerator.generate();
    const hash = this.tokenHasher.hash(raw);
    const expiresAt = new Date(Date.now() + this.config.passwordResetTtlSeconds * 1000);
    credential.issueVerificationToken('password_reset', hash, expiresAt);
    await this.credentialRepository.updateTokens(credential);

    await this.mailer.sendPasswordResetEmail(
      credential.email,
      `${this.config.webBaseUrl}/password/reset/${raw}`,
    );
  }
}
