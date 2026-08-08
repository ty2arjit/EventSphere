import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { InvalidCredentialsError } from '../domain/errors';

export interface LogoutInput {
  userCredentialId: string;
  sessionId: string;
}

/**
 * Revokes a single session. Idempotent — logging out an already-revoked
 * session is a no-op, not an error, so a browser retrying a clear-cookie
 * request doesn't produce noisy 4xxs.
 */
export class LogoutService {
  constructor(
    private readonly credentialRepository: UserCredentialRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: LogoutInput): Promise<void> {
    const credential = await this.credentialRepository.findById(input.userCredentialId);
    if (!credential) {
      throw new InvalidCredentialsError();
    }
    credential.revokeSession(input.sessionId, 'logout');
    await this.credentialRepository.updateSessions(credential);
    for (const event of credential.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
  }
}
