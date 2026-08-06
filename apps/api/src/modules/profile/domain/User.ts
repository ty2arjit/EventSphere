import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/events/DomainEvent';
import { AlreadyVerifiedError, InvalidLifecycleTransitionError } from './errors';
import { Email } from './valueObjects/Email';
import { FullName } from './valueObjects/FullName';
import { Avatar } from './valueObjects/Avatar';
import { UserProfile, ProfilePatch, UserProfileProps } from './entities/UserProfile';
import { UserPreferences, PreferencesPatch, UserPreferencesProps } from './entities/UserPreferences';
import { profileRegistered } from './events/ProfileRegistered';
import { profileUpdated } from './events/ProfileUpdated';
import { avatarChanged } from './events/AvatarChanged';
import { preferencesUpdated } from './events/PreferencesUpdated';
import { profileVerified } from './events/ProfileVerified';
import { profileDeactivated } from './events/ProfileDeactivated';

/**
 * Aggregate Root — Profile Domain (Canonical Architecture Specification,
 * Section 2.1). Full Ch.19 scope: identity + owned UserProfile/UserPreferences
 * entities + lifecycle.
 *
 * No framework code here — no Prisma, no Express, no HTTP (Constitution
 * Article 11). Pure business logic only.
 */

export type UserStatus = 'registered' | 'verified' | 'active' | 'inactive' | 'archived';

interface UserProps {
  id: string;
  email: Email;
  name: FullName;
  profile: UserProfile;
  preferences: UserPreferences;
  status: UserStatus;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Raw shape handed to fromPersistence() by the Infrastructure layer — plain
 * primitives as read from the database, not yet wrapped in VOs/Entities.
 */
export interface UserPersistenceProps {
  id: string;
  email: string;
  name: string;
  status: UserStatus;
  verifiedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  profile: Omit<UserProfileProps, 'userId' | 'avatar'> & { avatarUrl: string | null };
  preferences: Omit<UserPreferencesProps, 'userId'>;
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
   * fully formed and self-identified the moment it exists in memory. Always
   * creates a default UserProfile and UserPreferences alongside it — a User
   * without them would violate "Single Canonical Profile" (Ch.19).
   */
  static register(email: string, name: string): User {
    const validEmail = Email.create(email);
    const validName = FullName.create(name);
    const id = randomUUID();
    const now = new Date();

    const user = new User({
      id,
      email: validEmail,
      name: validName,
      profile: UserProfile.createDefault(id),
      preferences: UserPreferences.createDefault(id),
      status: 'registered',
      verifiedAt: null,
      createdAt: now,
      updatedAt: now,
    });

    user.pendingEvents.push(
      profileRegistered({
        userId: user.props.id,
        email: validEmail.value,
        name: validName.value,
      }),
    );

    return user;
  }

  /**
   * Reconstructs a User from persisted data. Used only by the Infrastructure
   * layer (PrismaProfileRepository) when mapping database rows back into a
   * domain object — never called from Application or Controller code.
   *
   * Deliberately records NO events: replaying history is not a new business
   * fact.
   */
  static fromPersistence(props: UserPersistenceProps): User {
    return new User({
      id: props.id,
      email: Email.create(props.email),
      name: FullName.create(props.name),
      profile: UserProfile.fromPersistence({
        userId: props.id,
        avatar: Avatar.create(props.profile.avatarUrl),
        bio: props.profile.bio,
        headline: props.profile.headline,
        institution: props.profile.institution,
        department: props.profile.department,
        graduationYear: props.profile.graduationYear,
      }),
      preferences: UserPreferences.fromPersistence({
        userId: props.id,
        ...props.preferences,
      }),
      status: props.status,
      verifiedAt: props.verifiedAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Returns recorded events and clears them, so an event can never be
   * published twice from the same aggregate instance.
   */
  pullDomainEvents(): DomainEvent[] {
    return this.pendingEvents.splice(0, this.pendingEvents.length);
  }

  /**
   * Bio/headline/institution/department/graduationYear as one fact — these
   * fields aren't independently meaningful business events (Constitution
   * Article 37, minimize concepts).
   */
  updateProfile(patch: ProfilePatch): void {
    this.props.profile.applyPatch(patch);
    this.touch();
    this.pendingEvents.push(
      profileUpdated({ userId: this.props.id, changedFields: Object.keys(patch) }),
    );
  }

  /** Kept separate from updateProfile — Avatar is rendered across many other bounded contexts. */
  updateAvatar(url: string | null): void {
    const avatar = Avatar.create(url);
    this.props.profile.updateAvatar(avatar);
    this.touch();
    this.pendingEvents.push(avatarChanged({ userId: this.props.id, avatarUrl: avatar.url }));
  }

  updatePreferences(patch: PreferencesPatch): void {
    this.props.preferences.applyPatch(patch);
    this.touch();
    this.pendingEvents.push(
      preferencesUpdated({ userId: this.props.id, changedFields: Object.keys(patch) }),
    );
  }

  /** Registered -> Verified. Enforces the "Verified Identity" invariant (Ch.19). */
  verifyIdentity(): void {
    if (this.props.verifiedAt !== null) {
      throw new AlreadyVerifiedError(this.props.id);
    }
    if (this.props.status !== 'registered') {
      throw new InvalidLifecycleTransitionError(this.props.status, 'verified');
    }
    const now = new Date();
    this.props.status = 'verified';
    this.props.verifiedAt = now;
    this.touch(now);
    this.pendingEvents.push(
      profileVerified({ userId: this.props.id, verifiedAt: now.toISOString() }),
    );
  }

  /** Verified -> Active, or Inactive -> Active (reactivation). */
  activate(): void {
    if (this.props.status !== 'verified' && this.props.status !== 'inactive') {
      throw new InvalidLifecycleTransitionError(this.props.status, 'active');
    }
    this.props.status = 'active';
    this.touch();
  }

  /** Active -> Inactive. Soft deletion (Ch.19) — never removes data. */
  deactivate(): void {
    if (this.props.status !== 'active') {
      throw new InvalidLifecycleTransitionError(this.props.status, 'inactive');
    }
    const now = new Date();
    this.props.status = 'inactive';
    this.touch(now);
    this.pendingEvents.push(
      profileDeactivated({ userId: this.props.id, deactivatedAt: now.toISOString() }),
    );
  }

  /**
   * Inactive -> Archived. No event published — no confirmed cross-context
   * consumer yet (Constitution Article 37); can be added later with zero
   * rework to this method.
   */
  archive(): void {
    if (this.props.status !== 'inactive') {
      throw new InvalidLifecycleTransitionError(this.props.status, 'archived');
    }
    this.props.status = 'archived';
    this.touch();
  }

  private touch(at: Date = new Date()): void {
    this.props.updatedAt = at;
  }

  get id(): string {
    return this.props.id;
  }

  get email(): string {
    return this.props.email.value;
  }

  get name(): string {
    return this.props.name.value;
  }

  get status(): UserStatus {
    return this.props.status;
  }

  get verifiedAt(): Date | null {
    return this.props.verifiedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  get profile(): UserProfile {
    return this.props.profile;
  }

  get preferences(): UserPreferences {
    return this.props.preferences;
  }
}
