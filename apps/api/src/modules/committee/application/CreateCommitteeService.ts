import type { EventCommitteeRepository } from "../domain/EventCommitteeRepository";
import type { EventPublisher } from "../../../shared/events/EventPublisher";
import { EventCommittee } from "../domain/EventCommittee";
import { CommitteeAlreadyExistsError } from "../domain/errors";
import { committeeCreated } from "../domain/events/CommitteeCreated";

export class CreateCommitteeService {
  constructor(
    private readonly repo: EventCommitteeRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(eventId: string, communityId: string, name: string): Promise<EventCommittee> {
    const existing = await this.repo.findByEventId(eventId);
    if (existing) throw new CommitteeAlreadyExistsError(eventId);

    const committee = EventCommittee.create(eventId, communityId, name);
    await this.repo.save(committee);
    await this.publisher.publish(committeeCreated(committee.id, eventId, communityId));
    return committee;
  }
}
