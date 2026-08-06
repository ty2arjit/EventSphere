import { InvalidPreferencesError } from '../errors';

export type Theme = 'light' | 'dark' | 'system';

const VALID_THEMES: readonly Theme[] = ['light', 'dark', 'system'];

export interface UserPreferencesProps {
  userId: string;
  language: string;
  timezone: string;
  theme: Theme;
  notifyByEmail: boolean;
  notifyInApp: boolean;
}

export interface PreferencesPatch {
  language?: string;
  timezone?: string;
  theme?: Theme;
  notifyByEmail?: boolean;
  notifyInApp?: boolean;
}

/**
 * Owned Entity — Profile Domain (Ch.19, Canonical Architecture Specification
 * Section 2.1). Keyed by userId, same rationale as UserProfile. Constructed
 * and mutated only through the User aggregate root (Constitution Article 13).
 */
export class UserPreferences {
  private constructor(private props: UserPreferencesProps) {}

  static createDefault(userId: string): UserPreferences {
    return new UserPreferences({
      userId,
      language: 'en',
      timezone: 'UTC',
      theme: 'system',
      notifyByEmail: true,
      notifyInApp: true,
    });
  }

  static fromPersistence(props: UserPreferencesProps): UserPreferences {
    return new UserPreferences(props);
  }

  applyPatch(patch: PreferencesPatch): void {
    if (patch.language !== undefined) {
      const trimmed = patch.language.trim();
      if (trimmed.length === 0) {
        throw new InvalidPreferencesError('Language must not be empty');
      }
      this.props.language = trimmed;
    }
    if (patch.timezone !== undefined) {
      const trimmed = patch.timezone.trim();
      if (trimmed.length === 0) {
        throw new InvalidPreferencesError('Timezone must not be empty');
      }
      this.props.timezone = trimmed;
    }
    if (patch.theme !== undefined) {
      if (!VALID_THEMES.includes(patch.theme)) {
        throw new InvalidPreferencesError(`Invalid theme: ${patch.theme}`);
      }
      this.props.theme = patch.theme;
    }
    if (patch.notifyByEmail !== undefined) {
      this.props.notifyByEmail = patch.notifyByEmail;
    }
    if (patch.notifyInApp !== undefined) {
      this.props.notifyInApp = patch.notifyInApp;
    }
  }

  get userId(): string {
    return this.props.userId;
  }

  get language(): string {
    return this.props.language;
  }

  get timezone(): string {
    return this.props.timezone;
  }

  get theme(): Theme {
    return this.props.theme;
  }

  get notifyByEmail(): boolean {
    return this.props.notifyByEmail;
  }

  get notifyInApp(): boolean {
    return this.props.notifyInApp;
  }
}
