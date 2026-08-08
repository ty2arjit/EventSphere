import type { EventCommittee } from "./EventCommittee";

export interface EventCommitteeRepository {
  findById(id: string): Promise<EventCommittee | null>;
  findByEventId(eventId: string): Promise<EventCommittee | null>;
  save(committee: EventCommittee): Promise<void>;
  update(committee: EventCommittee): Promise<void>;
}
