/**
 * Configuration bundle for Authentication Application Services. Injected
 * from the composition root so tests can override every duration in one
 * place (e.g. `accessTokenTtlSeconds: 1` for expiry tests) and production
 * reads real values from env.
 */
export interface AuthConfig {
  /** Access token lifetime — kept short so a compromised token has a small blast radius. */
  accessTokenTtlSeconds: number;
  /** Refresh token lifetime — long enough that users rarely re-login on trusted devices. */
  refreshTokenTtlSeconds: number;
  /** Email verification link validity. */
  emailVerificationTtlSeconds: number;
  /** Password reset link validity. */
  passwordResetTtlSeconds: number;
  /** Base URL used to construct verification/reset links (`WEB_BASE_URL`). */
  webBaseUrl: string;
}

export const DEFAULT_AUTH_CONFIG: AuthConfig = {
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlSeconds: 30 * 24 * 60 * 60,
  emailVerificationTtlSeconds: 24 * 60 * 60,
  passwordResetTtlSeconds: 1 * 60 * 60,
  webBaseUrl: 'http://localhost:3000',
};
