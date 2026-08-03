/**
 * API endpoint configuration.
 *
 * `NEXT_PUBLIC_API_URL` must carry the NEXT_PUBLIC_ prefix because the
 * registration request is made from the browser — the frontend calls the
 * Express API directly rather than proxying through the Next.js server
 * (see the plan's Section 3 rationale for rejecting Server Actions).
 *
 * The value is a public endpoint address and contains no secrets.
 *
 * Next.js inlines NEXT_PUBLIC_ variables at BUILD time, not runtime — so this
 * must be set in the deployment environment before building, and cannot be
 * changed by restarting the app.
 */

const DEFAULT_API_BASE_URL = 'http://localhost:4000';

export function getApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();

  if (!configured) {
    // Local development convenience. A production build without this set
    // would otherwise fail confusingly at request time with no indication
    // that configuration is the cause.
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[api] NEXT_PUBLIC_API_URL is not set; falling back to ' +
          `${DEFAULT_API_BASE_URL}, which will not work in a deployed environment.`,
      );
    }
    return DEFAULT_API_BASE_URL;
  }

  // Normalise so callers can always join with a leading-slash path without
  // producing a double slash.
  return configured.replace(/\/+$/, '');
}

/** Client-side deadline. Without one, a hung request leaves the UI spinning forever. */
export const REQUEST_TIMEOUT_MS = 10_000;
