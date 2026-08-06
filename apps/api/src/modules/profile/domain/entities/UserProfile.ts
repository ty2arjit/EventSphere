import { InvalidProfileFieldError } from '../errors';
import { Avatar } from '../valueObjects/Avatar';

const MIN_GRADUATION_YEAR = 1950;
const MAX_GRADUATION_YEAR_OFFSET = 10;

export interface UserProfileProps {
  userId: string;
  avatar: Avatar;
  bio: string | null;
  headline: string | null;
  institution: string | null;
  department: string | null;
  graduationYear: number | null;
}

export interface ProfilePatch {
  bio?: string | null;
  headline?: string | null;
  institution?: string | null;
  department?: string | null;
  graduationYear?: number | null;
}

/**
 * Owned Entity — Profile Domain (Ch.19, Canonical Architecture Specification
 * Section 2.1). Keyed by userId (the User's id) rather than a separate
 * synthetic id — it cannot exist without exactly one owning User and no
 * other aggregate references it independently (Constitution Article 37).
 *
 * Constructed and mutated only through the User aggregate root (Constitution
 * Article 13) — no public constructor.
 */
export class UserProfile {
  private constructor(private props: UserProfileProps) {}

  static createDefault(userId: string): UserProfile {
    return new UserProfile({
      userId,
      avatar: Avatar.empty(),
      bio: null,
      headline: null,
      institution: null,
      department: null,
      graduationYear: null,
    });
  }

  static fromPersistence(props: UserProfileProps): UserProfile {
    return new UserProfile(props);
  }

  applyPatch(patch: ProfilePatch): void {
    if (patch.bio !== undefined) {
      this.props.bio = patch.bio;
    }
    if (patch.headline !== undefined) {
      this.props.headline = patch.headline;
    }
    if (patch.institution !== undefined) {
      this.props.institution = patch.institution;
    }
    if (patch.department !== undefined) {
      this.props.department = patch.department;
    }
    if (patch.graduationYear !== undefined) {
      this.validateGraduationYear(patch.graduationYear);
      this.props.graduationYear = patch.graduationYear;
    }
  }

  updateAvatar(avatar: Avatar): void {
    this.props.avatar = avatar;
  }

  private validateGraduationYear(year: number | null): void {
    if (year === null) {
      return;
    }
    const maxYear = new Date().getFullYear() + MAX_GRADUATION_YEAR_OFFSET;
    if (!Number.isInteger(year) || year < MIN_GRADUATION_YEAR || year > maxYear) {
      throw new InvalidProfileFieldError(
        `Graduation year must be an integer between ${MIN_GRADUATION_YEAR} and ${maxYear}`,
      );
    }
  }

  get userId(): string {
    return this.props.userId;
  }

  get avatar(): Avatar {
    return this.props.avatar;
  }

  get bio(): string | null {
    return this.props.bio;
  }

  get headline(): string | null {
    return this.props.headline;
  }

  get institution(): string | null {
    return this.props.institution;
  }

  get department(): string | null {
    return this.props.department;
  }

  get graduationYear(): number | null {
    return this.props.graduationYear;
  }
}
