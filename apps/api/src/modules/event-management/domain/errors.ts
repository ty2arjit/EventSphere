import { DomainError, DomainErrorKind } from '../../../shared/errors/DomainError';

export class EventNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'EVENT_NOT_FOUND';
  constructor(id: string) { super(`Event not found: ${id}`); }
}

export class InvalidTransitionError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVALID_LIFECYCLE_TRANSITION';
  constructor(from: string, to: string) {
    super(`Cannot transition from ${from} to ${to}`);
  }
}

export class EventReadOnlyError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'EVENT_READ_ONLY';
  constructor() { super('Archived or cancelled events are read-only'); }
}

export class SessionNotFoundError extends DomainError {
  readonly kind: DomainErrorKind = 'NOT_FOUND';
  readonly code = 'SESSION_NOT_FOUND';
  constructor(id: string) { super(`Session not found: ${id}`); }
}

export class SessionRequiresLiveEventError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'SESSION_REQUIRES_LIVE_EVENT';
  constructor() { super('Session cannot go Live unless the parent Event is Live'); }
}

export class EventSlugTakenError extends DomainError {
  readonly kind: DomainErrorKind = 'CONFLICT';
  readonly code = 'EVENT_SLUG_TAKEN';
  constructor(slug: string) { super(`Event slug already taken: ${slug}`); }
}
