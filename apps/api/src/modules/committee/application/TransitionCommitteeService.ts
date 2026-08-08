import type { EventCommitteeRepository } from "../domain/EventCommitteeRepository";
import type { EventPublisher } from "../../../shared/events/EventPublisher";
import { CommitteeNotFoundError } from "../domain/errors";
import { committeeLifecycleChanged } from "../domain/events/CommitteeLifecycleChanged";
import type { CommitteeLifecycleState } from "../domain/valueObjects/CommitteeLifecycleState";

const TRANSITION_METHODS: Record<string, string> = {
  Formation: "startFormation",
  Active: "activate",
  Completed: "complete",
  Archived: "archive",
};

export class TransitionCommitteeService {
  constructor(
    private readonly repo: EventCommitteeRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async execute(committeeId: string, targetState: string): Promise<void> {
    const committee = await this.repo.findById(committeeId);
    if (!committee) throw new CommitteeNotFoundError(committeeId);

    const method = TRANSITION_METHODS[targetState];
    if (!method) throw new Error(`Unknown target state: ${targetState}`);

    const fromState = committee.state;
    (committee as unknown as Record<string, () => void>)[method]!();
    await this.repo.update(committee);
    await this.publisher.publish(committeeLifecycleChanged(committeeId, fromState, targetState));
  }
}
