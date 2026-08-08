import type { EventCommitteeRepository } from "../domain/EventCommitteeRepository";
import { CommitteeNotFoundError } from "../domain/errors";
import type { EventCommittee } from "../domain/EventCommittee";

export class GetCommitteeService {
  constructor(private readonly repo: EventCommitteeRepository) {}

  async byId(id: string): Promise<EventCommittee> {
    const committee = await this.repo.findById(id);
    if (!committee) throw new CommitteeNotFoundError(id);
    return committee;
  }

  async byEventId(eventId: string): Promise<EventCommittee | null> {
    return this.repo.findByEventId(eventId);
  }
}
