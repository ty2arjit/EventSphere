import { DomainError, DomainErrorKind } from '../../../../shared/errors/DomainError';

export class InvalidTimeSlotError extends DomainError {
  readonly kind: DomainErrorKind = 'VALIDATION';
  readonly code = 'INVALID_TIME_SLOT';
  constructor() {
    super('Start time must precede end time');
  }
}

export interface TimeSlot {
  startAt: Date;
  endAt: Date;
}

export function validateTimeSlot(slot: TimeSlot): void {
  if (slot.startAt >= slot.endAt) throw new InvalidTimeSlotError();
}
