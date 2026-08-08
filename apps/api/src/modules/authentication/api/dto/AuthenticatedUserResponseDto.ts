/**
 * Public representation of the currently authenticated user.
 * Deliberately narrow — the hashed password and session details never
 * leave the server, per Ch.20 Security Principles.
 */
export interface AuthenticatedUserResponseDto {
  id: string;
  email: string;
  emailVerified: boolean;
  providers: Array<{ provider: string; linkedAt: string }>;
}

/**
 * Response after register/login/reset — deliberately minimal. Tokens
 * are set as HTTP-only cookies rather than returned in the body, so the
 * body just confirms success shape for the frontend.
 */
export interface AuthResultResponseDto {
  user: AuthenticatedUserResponseDto;
}

/**
 * Generic acknowledgement returned for any endpoint that must not
 * leak whether an operation actually happened (registration, password
 * reset request, email verification request). BL-002 mitigation — the
 * response body carries no information beyond "we received your request."
 */
export interface AcknowledgementResponseDto {
  ok: true;
}
