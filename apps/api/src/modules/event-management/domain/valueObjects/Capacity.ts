import { DomainError, DomainErrorKind } from '../../../../shared/errors/DomainError';

export class InvalidCapacityError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVALID_CAPACITY';
  constructor() {
    super('Capacity must be a positive integer or null (unlimited)');
  }
}

export interface Capacity {
  min: number | null;
  max: number | null;
}

export function validateCapacity(cap: Capacity): void {
  if (cap.max !== null && cap.max < 1) throw new InvalidCapacityError();
  if (cap.min !== null && cap.min < 0) throw new InvalidCapacityError();
  if (cap.min !== null && cap.max !== null && cap.min > cap.max) throw new InvalidCapacityError();
}
