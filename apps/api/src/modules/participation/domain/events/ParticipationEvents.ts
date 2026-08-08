import { createDomainEvent, type DomainEvent } from "../../../../shared/events/DomainEvent";

export function registrationCreated(registrationId: string, eventId: string): DomainEvent {
  return createDomainEvent({
    eventType: "RegistrationCreated",
    aggregateId: registrationId,
    aggregateType: "Registration",
    payload: { eventId },
  });
}

export function registrationOpened(registrationId: string, eventId: string): DomainEvent {
  return createDomainEvent({
    eventType: "RegistrationOpened",
    aggregateId: registrationId,
    aggregateType: "Registration",
    payload: { eventId },
  });
}

export function registrationClosed(registrationId: string, eventId: string): DomainEvent {
  return createDomainEvent({
    eventType: "RegistrationClosed",
    aggregateId: registrationId,
    aggregateType: "Registration",
    payload: { eventId },
  });
}

export function enrollmentCreated(enrollmentId: string, eventId: string, userId: string, status: string): DomainEvent {
  return createDomainEvent({
    eventType: "EnrollmentCreated",
    aggregateId: enrollmentId,
    aggregateType: "Enrollment",
    payload: { eventId, userId, status },
  });
}

export function enrollmentStatusChanged(enrollmentId: string, fromStatus: string, toStatus: string): DomainEvent {
  return createDomainEvent({
    eventType: "EnrollmentStatusChanged",
    aggregateId: enrollmentId,
    aggregateType: "Enrollment",
    payload: { fromStatus, toStatus },
  });
}
