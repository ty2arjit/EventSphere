import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { PlaintextPassword } from '../domain/valueObjects/PlaintextPassword';
import { PasswordHasher } from '../domain/services/PasswordHasher';
import { TokenHasher } from '../domain/services/TokenHasher';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { VerificationTokenNotFoundError } from '../domain/errors';

export interface CompletePasswordResetInput {
  rawToken: string;
  newPassword: string;
}

/**
 * Consumes a password-reset token, updates the credential's password
 * hash, and revokes every session — the user must log in fresh with
 * the new password. This matches Ch.20's session-security guidance:
 * a password change invalidates existing authenticated identities.
 */
export class CompletePasswordResetService {
  constructor(
    private readonly credentialRepository: UserCredentialRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenHasher: TokenHasher,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: CompletePasswordResetInput): Promise<void> {
    const newPassword = PlaintextPassword.create(input.newPassword);
    const hash = this.tokenHasher.hash(input.rawToken);
    const credential = await this.credentialRepository.findByVerificationTokenHash(
      'password_reset',
      hash,
    );
    if (!credential) {
      throw new VerificationTokenNotFoundError();
    }

    credential.consumeVerificationToken('password_reset', hash);
    const newHashed = await this.passwordHasher.hash(newPassword);
    credential.changePassword(newHashed, 'password_reset', null);

    await this.credentialRepository.updateTokens(credential);
    await this.credentialRepository.updateSessions(credential);
    await this.credentialRepository.updateCredential(credential);

    for (const event of credential.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
  }
}
