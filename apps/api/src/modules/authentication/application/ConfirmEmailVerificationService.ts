import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { TokenHasher } from '../domain/services/TokenHasher';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { VerificationTokenNotFoundError } from '../domain/errors';

/**
 * Consumes an email-verification token, flips the credential's
 * emailVerifiedAt, and publishes EmailVerified. Profile subscribes to
 * that event and updates User.verifiedAt separately (see subscribers/
 * verifyProfileOnEmailVerified.ts).
 */
export class ConfirmEmailVerificationService {
  constructor(
    private readonly credentialRepository: UserCredentialRepository,
    private readonly tokenHasher: TokenHasher,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(rawToken: string): Promise<{ userCredentialId: string }> {
    const hash = this.tokenHasher.hash(rawToken);
    const credential = await this.credentialRepository.findByVerificationTokenHash(
      'email_verification',
      hash,
    );
    if (!credential) {
      throw new VerificationTokenNotFoundError();
    }

    credential.consumeVerificationToken('email_verification', hash);
    credential.verifyEmail();

    await this.credentialRepository.updateTokens(credential);
    await this.credentialRepository.updateCredential(credential);

    for (const event of credential.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }

    return { userCredentialId: credential.id };
  }
}
