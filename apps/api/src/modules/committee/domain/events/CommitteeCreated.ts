import { createDomainEvent, type DomainEvent } from "../../../../shared/events/DomainEvent";

export function committeeCreated(committeeId: string, eventId: string, communityId: string): DomainEvent {
  return createDomainEvent({
    eventType: "CommitteeCreated",
    aggregateId: committeeId,
    aggregateType: "EventCommittee",
    payload: { eventId, communityId },
  });
}
