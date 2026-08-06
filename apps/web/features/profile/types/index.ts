/**
 * Profile feature — request/response models.
 *
 * These live here rather than in `lib/api/types.ts` per rule 4 of the canonical
 * frontend convention: `lib/` holds transport primitives only, while models
 * specific to a bounded context belong to that context's feature module.
 *
 * Mirrors the backend's `ProfileResponseDto` shape. Hand-written rather than
 * imported from `apps/api` — the HTTP contract is the integration point, not
 * shared code (API-First boundary, SystemDesign.md).
 */

export type ProfileStatus = "registered" | "verified" | "active" | "inactive" | "archived";
export type Theme = "light" | "dark" | "system";

export interface ProfileDetails {
  avatarUrl: string | null;
  bio: string | null;
  headline: string | null;
  institution: string | null;
  department: string | null;
  graduationYear: number | null;
}

export interface ProfilePreferences {
  language: string;
  timezone: string;
  theme: Theme;
  notifyByEmail: boolean;
  notifyInApp: boolean;
}

/** Full profile shape returned by every Profile endpoint. */
export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  status: ProfileStatus;
  verifiedAt: string | null;
  profile: ProfileDetails;
  preferences: ProfilePreferences;
}

/** Request payload of `POST /api/v1/profile`. */
export interface RegisterProfileInput {
  email: string;
  name: string;
}

/** Request payload of `PATCH /api/v1/profile/:id`. */
export interface UpdateProfileInput {
  bio?: string | null;
  headline?: string | null;
  institution?: string | null;
  department?: string | null;
  graduationYear?: number | null;
}

/** Request payload of `PATCH /api/v1/profile/:id/avatar`. */
export interface UpdateAvatarInput {
  avatarUrl: string | null;
}

/** Request payload of `PATCH /api/v1/profile/:id/preferences`. */
export interface UpdatePreferencesInput {
  language?: string;
  timezone?: string;
  theme?: Theme;
  notifyByEmail?: boolean;
  notifyInApp?: boolean;
}
