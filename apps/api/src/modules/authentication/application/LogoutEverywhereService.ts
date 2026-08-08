import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { InvalidCredentialsError } from '../domain/errors';

export class LogoutEverywhereService {
  constructor(
    private readonly credentialRepository: UserCredentialRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(userCredentialId: string): Promise<void> {
    const credential = await this.credentialRepository.findById(userCredentialId);
    if (!credential) {
      throw new InvalidCredentialsError();
    }
    credential.revokeAllSessions('logout_everywhere');
    await this.credentialRepository.updateSessions(credential);
    for (const event of credential.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }
  }
}
