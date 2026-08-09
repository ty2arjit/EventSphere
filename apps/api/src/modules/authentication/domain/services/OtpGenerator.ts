/**
 * Generates short, human-typeable numeric codes for email verification.
 * Distinct from RandomTokenGenerator (which produces long URL-safe tokens
 * for links) — this is for the "enter the 6-digit code" flow.
 */
export interface OtpGenerator {
  generate(): string;
}
