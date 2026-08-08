/**
 * Authentication's narrow contract for the one thing it needs from Profile
 * Domain during registration: creating the identity that its credential
 * will then attach to.
 *
 * Deliberately owned by THIS bounded context (Constitution Article 12,
 * Anti-Corruption Layer). The composition root wires it to a small
 * adapter that calls Profile's own RegisterProfileService — so Auth
 * never imports ProfileRepository or User directly.
 */
export interface ProfileGateway {
  /**
   * Creates a new Profile-side User with the given email/name and returns
   * its assigned id. Throws only for genuine failures (validation, DB
   * error); "email already exists" is intentionally NOT signalled to the
   * caller (BL-002) — Auth's registration flow treats existing and new
   * emails identically at the API layer.
   */
  createProfile(input: { email: string; name: string }): Promise<{ userId: string }>;
  /** Returns true if a Profile exists for this email; used ONLY by the internal duplicate check. */
  findUserIdByEmail(email: string): Promise<string | null>;
}
