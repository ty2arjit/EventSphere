import { describe, expect, it } from "vitest";
import { ManageTaskService } from "./ManageTaskService";
import { InMemoryOperationalTaskRepository } from "../test-support/InMemoryOperationalTaskRepository";
import { RecordingEventPublisher } from "../../profile/test-support/RecordingEventPublisher";

/**
 * Regression coverage for a real bug: the controller sent { targetStatus }
 * (matching the frontend's NEXT_STATUS map, e.g. "InProgress"), but this
 * service expected { action } — one of the task's own FSM method names
 * ("start", "block", ...). Every transition attempt from the actual UI
 * failed with "task[action] is not a function", 500, silently, forever —
 * nothing caught it because this service had zero test coverage.
 */
function buildService() {
  const repo = new InMemoryOperationalTaskRepository();
  const publisher = new RecordingEventPublisher();
  const service = new ManageTaskService(repo, publisher);
  return { service, repo };
}

describe("ManageTaskService.transition", () => {
  it("moves Todo -> InProgress via targetStatus (internally: start)", async () => {
    const { service } = buildService();
    const task = await service.create("event-1", "Setup chairs");

    await service.transition(task.id, "InProgress");

    const reloaded = await service.getById(task.id);
    expect(reloaded.status).toBe("InProgress");
  });

  it("moves Blocked -> InProgress via targetStatus (internally: unblock) — the same target status as start, resolved by current status", async () => {
    const { service } = buildService();
    const task = await service.create("event-1", "Setup chairs");
    await service.transition(task.id, "InProgress");
    await service.transition(task.id, "Blocked");

    await service.transition(task.id, "InProgress");

    const reloaded = await service.getById(task.id);
    expect(reloaded.status).toBe("InProgress");
  });

  it("moves InProgress -> Completed via targetStatus (internally: complete)", async () => {
    const { service } = buildService();
    const task = await service.create("event-1", "Setup chairs");
    await service.transition(task.id, "InProgress");

    await service.transition(task.id, "Completed");

    const reloaded = await service.getById(task.id);
    expect(reloaded.status).toBe("Completed");
  });

  it("rejects an invalid transition instead of silently no-op'ing", async () => {
    const { service } = buildService();
    const task = await service.create("event-1", "Setup chairs");

    await expect(service.transition(task.id, "Completed")).rejects.toThrow(
      /Cannot transition task from Todo to Completed/,
    );
  });
});
