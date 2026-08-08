/**
 * Transport-agnostic classification of a business-rule violation.
 *
 * These describe BUSINESS meaning, not HTTP. "CONFLICT" means the requested
 * operation contradicts existing business state — it is the HTTP layer's job
 * (and only the HTTP layer's job) to decide that maps to 409. A future gRPC
 * or CLI adapter would map the same kinds to entirely different codes.
 */
export type DomainErrorKind =
  | 'VALIDATION'
  | 'CONFLICT'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'RATE_LIMITED';

/**
 * Base class for expected business-rule violations (as opposed to unexpected
 * system failures). Every module's domain/application errors extend this so
 * the central error handler can translate them without knowing about any
 * specific bounded context (Constitution Article 12).
 *
 * Deliberately contains NO transport concepts — no HTTP status codes, no
 * headers, no framework types (Constitution Articles 2 and 11).
 */
export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}
