import { createDomainEvent, type DomainEvent } from "../../../../shared/events/DomainEvent";

export function committeeLifecycleChanged(
  committeeId: string,
  fromState: string,
  toState: string,
): DomainEvent {
  return createDomainEvent({
    eventType: "CommitteeLifecycleChanged",
    aggregateId: committeeId,
    aggregateType: "EventCommittee",
    payload: { fromState, toState },
  });
}
