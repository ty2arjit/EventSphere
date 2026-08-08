import { Request, Response, NextFunction } from 'express';
import { DomainError, DomainErrorKind } from './DomainError';
import { logger } from '../logger';

/**
 * The ONLY place business-error semantics are translated into HTTP.
 *
 * Maps transport-agnostic DomainErrorKind values to status codes. Keyed by
 * kind rather than by error code, so this file never needs to change as new
 * bounded contexts add new errors (Constitution Article 12 — bounded context
 * isolation). Record<DomainErrorKind, number> makes the mapping exhaustive:
 * adding a new kind without a status is a compile error, not a silent 500.
 */
const KIND_TO_HTTP_STATUS: Record<DomainErrorKind, number> = {
  VALIDATION: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  RATE_LIMITED: 429,
};

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof DomainError) {
    res.status(KIND_TO_HTTP_STATUS[err.kind]).json({ error: err.code, message: err.message });
    return;
  }

  logger.error({ err }, 'Unhandled error');
  res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Something went wrong' });
}
