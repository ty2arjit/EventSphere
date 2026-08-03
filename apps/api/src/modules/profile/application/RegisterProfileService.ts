import { ProfileRepository } from '../domain/ProfileRepository';
import { User } from '../domain/User';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { UniqueConstraintViolationError } from '../../../shared/errors/UniqueConstraintViolationError';
import { EmailAlreadyRegisteredError } from './errors';

export interface RegisterProfileInput {
  email: string;
  name: string;
}

/**
 * Application Service — exactly one use case (Constitution Article 24, no
 * God Services). Orchestrates the repository, the aggregate, and event
 * publication; makes no business-rule decisions of its own (Article 14).
 */
export class RegisterProfileService {
  constructor(
    private readonly profileRepository: ProfileRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(input: RegisterProfileInput): Promise<User> {
    const existing = await this.profileRepository.findByEmail(input.email.trim().toLowerCase());
    if (existing) {
      throw new EmailAlreadyRegisteredError(input.email);
    }

    const user = User.register(input.email, input.name);

    try {
      await this.profileRepository.save(user);
    } catch (error) {
      // DB unique constraint is the final guard even if the check above races.
      if (error instanceof UniqueConstraintViolationError) {
        throw new EmailAlreadyRegisteredError(input.email);
      }
      throw error;
    }

    // Published only after the write succeeds — an event must never announce
    // a fact that was rolled back (Constitution Part II: "Events are published
    // only after the originating transaction succeeds").
    for (const event of user.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }

    return user;
  }
}
