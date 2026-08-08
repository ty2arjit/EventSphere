import type { EventCommitteeRepository } from "../domain/EventCommitteeRepository";
import type { EventCommittee } from "../domain/EventCommittee";

export class InMemoryEventCommitteeRepository implements EventCommitteeRepository {
  private committees: EventCommittee[] = [];

  async findById(id: string): Promise<EventCommittee | null> {
    return this.committees.find((c) => c.id === id) ?? null;
  }

  async findByEventId(eventId: string): Promise<EventCommittee | null> {
    return this.committees.find((c) => c.eventId === eventId) ?? null;
  }

  async save(committee: EventCommittee): Promise<void> {
    this.committees.push(committee);
  }

  async update(committee: EventCommittee): Promise<void> {
    const idx = this.committees.findIndex((c) => c.id === committee.id);
    if (idx !== -1) this.committees[idx] = committee;
  }
}
