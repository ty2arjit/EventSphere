import { Prisma, PrismaClient, User as UserRecord, UserProfile as UserProfileRecord, UserPreferences as UserPreferencesRecord } from '@prisma/client';
import { ProfileRepository } from '../domain/ProfileRepository';
import { User, UserStatus } from '../domain/User';
import { Theme } from '../domain/entities/UserPreferences';
import { UniqueConstraintViolationError } from '../../../shared/errors/UniqueConstraintViolationError';

const PRISMA_UNIQUE_CONSTRAINT_CODE = 'P2002';

type UserRecordWithRelations = UserRecord & {
  profile: UserProfileRecord | null;
  preferences: UserPreferencesRecord | null;
};

const INCLUDE_RELATIONS = { profile: true, preferences: true } as const;

export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { email },
      include: INCLUDE_RELATIONS,
    });
    return record ? this.toDomain(record) : null;
  }

  async findById(id: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({
      where: { id },
      include: INCLUDE_RELATIONS,
    });
    return record ? this.toDomain(record) : null;
  }

  /** Insert-only path (registration). Creates all three rows atomically. */
  async save(user: User): Promise<void> {
    try {
      await this.prisma.$transaction([
        this.prisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            status: user.status,
            verifiedAt: user.verifiedAt,
            createdAt: user.createdAt,
          },
        }),
        this.prisma.userProfile.create({
          data: {
            userId: user.id,
            avatarUrl: user.profile.avatar.url,
            bio: user.profile.bio,
            headline: user.profile.headline,
            institution: user.profile.institution,
            department: user.profile.department,
            graduationYear: user.profile.graduationYear,
          },
        }),
        this.prisma.userPreferences.create({
          data: {
            userId: user.id,
            language: user.preferences.language,
            timezone: user.preferences.timezone,
            theme: user.preferences.theme,
            notifyByEmail: user.preferences.notifyByEmail,
            notifyInApp: user.preferences.notifyInApp,
          },
        }),
      ]);
    } catch (error) {
      if (this.isUniqueConstraintViolation(error)) {
        throw new UniqueConstraintViolationError('email');
      }
      throw error;
    }
  }

  /** users table only — status/verifiedAt/updatedAt (verify/activate/deactivate/archive). */
  async updateIdentity(user: User): Promise<void> {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        status: user.status,
        verifiedAt: user.verifiedAt,
        updatedAt: user.updatedAt,
      },
    });
  }

  /** users.updatedAt + user_profiles row (bio/headline/institution/department/graduationYear/avatar). */
  async updateProfile(user: User): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: user.updatedAt },
      }),
      this.prisma.userProfile.update({
        where: { userId: user.id },
        data: {
          avatarUrl: user.profile.avatar.url,
          bio: user.profile.bio,
          headline: user.profile.headline,
          institution: user.profile.institution,
          department: user.profile.department,
          graduationYear: user.profile.graduationYear,
        },
      }),
    ]);
  }

  /** users.updatedAt + user_preferences row. */
  async updatePreferences(user: User): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { updatedAt: user.updatedAt },
      }),
      this.prisma.userPreferences.update({
        where: { userId: user.id },
        data: {
          language: user.preferences.language,
          timezone: user.preferences.timezone,
          theme: user.preferences.theme,
          notifyByEmail: user.preferences.notifyByEmail,
          notifyInApp: user.preferences.notifyInApp,
        },
      }),
    ]);
  }

  private isUniqueConstraintViolation(error: unknown): boolean {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === PRISMA_UNIQUE_CONSTRAINT_CODE
    );
  }

  /**
   * Maps a Prisma row (+ its 1:1 relations) back into the aggregate. profile/
   * preferences are only nullable in the generated types because Prisma
   * can't express "always present" for a 1:1 relation — the migration's
   * backfill and every write path (save() always creates both rows
   * atomically) guarantee they exist for every User row. A null here means
   * the invariant was violated at the data level, which is a system failure,
   * not a business-rule violation — so it's an unchecked throw, not a
   * DomainError (Constitution Article 28: exceptions must never be swallowed).
   */
  private toDomain(record: UserRecordWithRelations): User {
    if (!record.profile || !record.preferences) {
      throw new Error(
        `Data integrity violation: User ${record.id} is missing its profile or preferences row`,
      );
    }

    return User.fromPersistence({
      id: record.id,
      email: record.email,
      name: record.name,
      status: record.status as UserStatus,
      verifiedAt: record.verifiedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      profile: {
        avatarUrl: record.profile.avatarUrl,
        bio: record.profile.bio,
        headline: record.profile.headline,
        institution: record.profile.institution,
        department: record.profile.department,
        graduationYear: record.profile.graduationYear,
      },
      preferences: {
        language: record.preferences.language,
        timezone: record.preferences.timezone,
        theme: record.preferences.theme as Theme,
        notifyByEmail: record.preferences.notifyByEmail,
        notifyInApp: record.preferences.notifyInApp,
      },
    });
  }
}
