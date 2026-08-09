import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { TokenHasher } from '../domain/services/TokenHasher';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { VerificationTokenNotFoundError } from '../domain/errors';

/**
 * OTP counterpart to ConfirmEmailVerificationService. Unlike the link
 * flow (which can look up the credential purely from a globally-unique
 * 256-bit token hash), a 6-digit code is not unique enough to search
 * for globally — two different users' codes can collide. So this always
 * requires the email up front and only searches *that* credential's own
 * tokens (UserCredential.consumeVerificationToken is already scoped this
 * way), which also means an unknown email and a wrong code produce the
 * same NotFound response — no account enumeration via this endpoint.
 */
export class ConfirmEmailVerificationOtpService {
  constructor(
    private readonly credentialRepository: UserCredentialRepository,
    private readonly tokenHasher: TokenHasher,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(email: string, code: string): Promise<{ userCredentialId: string }> {
    const credential = await this.credentialRepository.findByEmail(email);
    if (!credential) {
      throw new VerificationTokenNotFoundError();
    }

    const hash = this.tokenHasher.hash(code);
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
