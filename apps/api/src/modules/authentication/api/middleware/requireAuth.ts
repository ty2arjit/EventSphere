import { Request, Response, NextFunction } from 'express';
import { DomainError, DomainErrorKind } from '../../../../shared/errors/DomainError';

class UnauthorizedError extends DomainError {
  readonly kind: DomainErrorKind = 'UNAUTHORIZED';
  readonly code = 'AUTHENTICATION_REQUIRED';
  constructor() {
    super('Authentication required');
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new UnauthorizedError());
    return;
  }
  next();
}
