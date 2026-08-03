/**
 * Profile feature — PUBLIC INTERFACE.
 *
 * Everything other modules may use from this feature is re-exported here.
 * Nothing outside `features/profile/` should import from its subdirectories
 * directly: this barrel is the feature's equivalent of a bounded context's
 * published interface (Constitution Article 12 — no other context may reach
 * into another's internal implementation).
 *
 * Owning bounded context: **Profile Domain** (Canonical Architecture
 * Specification §1.1). The folder name matches the canonical name exactly, per
 * rule 1 of the frontend convention.
 */

export { ProfileRegistrationForm } from './components/ProfileRegistrationForm';
export { registerProfile } from './api/profileClient';
export type { ProfileResponse, RegisterProfileInput } from './types';
