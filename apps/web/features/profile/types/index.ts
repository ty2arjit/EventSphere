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

/** Success payload of `POST /api/v1/profile`. */
export interface ProfileResponse {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

/** Request payload of `POST /api/v1/profile`. */
export interface RegisterProfileInput {
  email: string;
  name: string;
}
