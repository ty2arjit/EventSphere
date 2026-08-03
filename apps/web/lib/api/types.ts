/**
 * Transport primitives for communicating with the EventSphere API.
 *
 * SCOPE (canonical frontend convention, rule 4): this file holds ONLY
 * context-agnostic transport types. Endpoint-specific request/response models
 * belong to the owning feature (`features/<context>/types/`).
 *
 * These describe the HTTP contract, never domain models. Business rules live in
 * the backend's Domain layer; nothing here duplicates them (Constitution
 * Article 29).
 */

/**
 * Transport-level failure classification.
 *
 * Deliberately mirrors the backend's own `DomainErrorKind` philosophy: describe
 * WHAT went wrong in stable terms, and let the presentation layer decide how to
 * say it. NETWORK/TIMEOUT/UNKNOWN cover failures that never reach the server and
 * therefore have no backend representation.
 */
export type ApiErrorKind =
  | 'VALIDATION' // 400 — malformed request
  | 'CONFLICT' // 409 — violates existing state (e.g. duplicate email)
  | 'NOT_FOUND' // 404
  | 'UNAUTHORIZED' // 401
  | 'FORBIDDEN' // 403
  | 'SERVER' // 5xx — backend fault
  | 'NETWORK' // request never reached the server
  | 'TIMEOUT' // request exceeded the client deadline
  | 'UNKNOWN'; // unrecognised status or unparseable body

export interface ApiError {
  kind: ApiErrorKind;
  /**
   * Stable machine-readable code. From the backend's `error` field when the
   * server responded (e.g. `EMAIL_ALREADY_REGISTERED`), or a client-side
   * sentinel (see CLIENT_ERROR_CODES) when it didn't.
   *
   * THIS is what the UI switches on to choose user-facing copy — never
   * `message`, which is a human-readable debugging aid and not a contract.
   */
  code: string;
  /** Diagnostic detail for logs. Not intended for direct display to users. */
  message: string;
  /** HTTP status, when a response was actually received. */
  status?: number;
}

/**
 * Discriminated union returned by every API call.
 *
 * Transport failures are returned as values, never thrown. Callers must handle
 * both branches, so an unhandled network error cannot slip through as an
 * unhandled promise rejection in a component.
 */
export type ApiResult<T> = { ok: true; data: T } | { ok: false; error: ApiError };

/** Sentinel codes for failures that originate client-side, with no server response. */
export const CLIENT_ERROR_CODES = {
  NETWORK_UNREACHABLE: 'NETWORK_UNREACHABLE',
  REQUEST_TIMEOUT: 'REQUEST_TIMEOUT',
  MALFORMED_RESPONSE: 'MALFORMED_RESPONSE',
} as const;
