/**
 * Infrastructure-level signal thrown by a repository when the database
 * rejects a write due to a unique constraint. Not a DomainError itself —
 * it's caught and translated into a meaningful business error by the
 * Application Service that requested the write (see Constitution Article 14
 * and 28: exceptions must be handled, transformed, logged, or rethrown,
 * never ignored).
 */
export class UniqueConstraintViolationError extends Error {
  constructor(public readonly field: string) {
    super(`Unique constraint violated on field: ${field}`);
    this.name = 'UniqueConstraintViolationError';
  }
}
