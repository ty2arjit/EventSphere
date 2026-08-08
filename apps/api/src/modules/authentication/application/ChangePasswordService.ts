import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { PlaintextPassword } from '../domain/valueObjects/PlaintextPassword';
import { PasswordHasher } from '../domain/services/PasswordHasher';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { InvalidCredentialsError } from '../domain/errors';

export interface ChangePasswordInput {
  userCredentialId: string;
  currentPassword: string;
  newPassword: string;
  /** Session to keep (i.e. the one making this request) — other sessions get revoked. */
  keepSessionId: string;
}

/**
 * For an already-authenticated user changing their own password.
 * Requires the current password as an additional check — session
 * hijacking would otherwise let an attacker lock out the real owner
 * without knowing it.
 *
 * Revokes every OTHER session but keeps the requesting one, so the
 * user isn't logged out of the tab they're currently using.
 */
export class ChangePasswordService {
  constructor(
    private readonly credentialRepository: UserCredentialRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: ChangePasswordInput): Promise<void> {
    const credential = await this.credentialRepository.findById(input.userCredentialId);
    if (!credential) {
      throw new InvalidCredentialsError();
    }

    let current;
    try {
      current = PlaintextPassword.create(input.currentPassword);
    } catch {
      throw new InvalidCredentialsError();
    }
    const ok = await credential.attemptPassword(current, this.passwordHasher);
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    const newPassword = PlaintextPassword.create(input.newPassword);
    const newHashed = await this.passwordHasher.hash(newPassword);
    credential.changePassword(newHashed, 'password_changed', input.keepSessionId);

    await this.credentialRepository.updateSessions(credential);
    await this.credentialRepository.updateCredential(credential);

    for (const event of credential.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
  }
}
