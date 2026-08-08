import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { TokenHasher } from '../domain/services/TokenHasher';
import { RandomTokenGenerator } from '../domain/services/RandomTokenGenerator';
import { Mailer } from '../infrastructure/Mailer';
import { AuthConfig } from './AuthConfig';

/**
 * Idempotent — the caller (typically a logged-in user who missed the
 * first email, or a "resend" button) always gets a generic success
 * response even if the credential is already verified or the address
 * doesn't exist. Rate-limited at the API layer.
 */
export class RequestEmailVerificationService {
  constructor(
    private readonly credentialRepository: UserCredentialRepository,
    private readonly tokenHasher: TokenHasher,
    private readonly tokenGenerator: RandomTokenGenerator,
    private readonly mailer: Mailer,
    private readonly config: AuthConfig,
  ) {}

  async execute(userCredentialId: string): Promise<void> {
    const credential = await this.credentialRepository.findById(userCredentialId);
    if (!credential || credential.emailVerifiedAt !== null) {
      return;
    }

    const raw = this.tokenGenerator.generate();
    const hash = this.tokenHasher.hash(raw);
    const expiresAt = new Date(Date.now() + this.config.emailVerificationTtlSeconds * 1000);
    credential.issueVerificationToken('email_verification', hash, expiresAt);
    await this.credentialRepository.updateTokens(credential);

    await this.mailer.sendVerificationEmail(
      credential.email,
      `${this.config.webBaseUrl}/email/verify/${raw}`,
    );
  }
}
