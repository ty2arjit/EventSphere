import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/events/DomainEvent';
import { InvalidEmailError, InvalidNameError } from './errors';
import { profileRegistered } from './events/ProfileRegistered';

/**
 * Aggregate Root — Profile Domain (Canonical Architecture Specification,
 * Section 2.1). Walking Skeleton scope only: id, email, name. Full Ch.19
 * scope (UserProfile, UserPreferences, avatar, bio, etc.) arrives in Phase 0.
 *
 * No framework code here — no Prisma, no Express, no HTTP (Constitution
 * Article 11). Pure business logic only.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface UserProps {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
}

export class User {
  /**
   * Events recorded by this aggregate but not yet published. The aggregate
   * RECORDS events (it owns the business fact); the Application Service
   * PUBLISHES them, and only after persistence succeeds — a domain object
   * must never reach out to infrastructure itself (Constitution Article 11),
   * and events must never escape for a transaction that later fails.
   */
  private readonly pendingEvents: DomainEvent[] = [];

  private constructor(private readonly props: UserProps) {}

  /**
   * Constructs a new, valid User. The aggregate assigns its own identity
   * (rather than relying on the database to assign it on insert) so it is
   * fully formed and self-identified the moment it exists in memory.
   */
  static register(email: string, name: string): User {
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      throw new InvalidEmailError(email);
    }

    const trimmedName = name.trim();
    if (trimmedName.length === 0) {
      throw new InvalidNameError();
    }

    const user = new User({
      id: randomUUID(),
      email: normalizedEmail,
      name: trimmedName,
      createdAt: new Date(),
    });

    user.pendingEvents.push(
      profileRegistered({
        userId: user.props.id,
        email: user.props.email,
        name: user.props.name,
      }),
    );

    return user;
  }

  /**
   * Reconstructs a User from persisted data. Used only by the Infrastructure
   * layer (PrismaProfileRepository) when mapping a database row back into a
   * domain object — never called from Application or Controller code.
   *
   * Deliberately records NO events: replaying history is not a new business
   * fact.
   */
  static fromPersistence(props: UserProps): User {
    return new User(props);
  }

  /**
   * Returns recorded events and clears them, so an event can never be
   * published twice from the same aggregate instance.
   */
  pullDomainEvents(): DomainEvent[] {
    return this.pendingEvents.splice(0, this.pendingEvents.length);
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email;
  }

  get name(): string {
    return this.props.name;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }
}
