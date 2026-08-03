import type { ApiError } from "./types";

/**
 * Translates a classified `ApiError` into copy suitable for display.
 *
 * This is the ONLY place transport errors become user-facing text. Two rules
 * from the frontend conventions are enforced structurally here:
 *
 *   - 11.2 — dispatch on the stable `code`, never on `message`
 *   - 11.3 — never render the backend's raw `message`; it is a diagnostic that
 *     may leak internal detail (identifiers, constraint names) and may change
 *     without notice
 *
 * Convention 11.1 also applies: the same bad input can surface as either a
 * transport-validation code (`VALIDATION_ERROR`) or a domain code
 * (`INVALID_EMAIL`) depending on which layer catches it first. Both must map to
 * sensible copy, and unrecognised codes must always fall back rather than
 * render nothing.
 */

/** Fallbacks keyed by transport classification — used when no specific code matches. */
const MESSAGES_BY_KIND: Record<ApiError["kind"], string> = {
  VALIDATION: "Please check the details you entered and try again.",
  CONFLICT: "That entry already exists.",
  NOT_FOUND: "We couldn't find what you were looking for.",
  UNAUTHORIZED: "You need to sign in to do that.",
  FORBIDDEN: "You don't have permission to do that.",
  SERVER: "Something went wrong on our end. Please try again in a moment.",
  NETWORK: "We couldn't reach the server. Check your connection and try again.",
  TIMEOUT: "That took too long to respond. Please try again.",
  UNKNOWN: "Something unexpected happened. Please try again.",
};

/**
 * Resolves display copy for an error.
 *
 * @param error       the classified failure returned by the API client
 * @param codeCopy    feature-specific copy keyed by backend error code; takes
 *                    precedence over the generic kind-based fallback so each
 *                    feature can phrase its own domain errors naturally
 */
export function getErrorMessage(
  error: ApiError,
  codeCopy: Readonly<Record<string, string>> = {},
): string {
  return codeCopy[error.code] ?? MESSAGES_BY_KIND[error.kind];
}
