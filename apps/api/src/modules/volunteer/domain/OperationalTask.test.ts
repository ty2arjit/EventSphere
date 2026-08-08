import { describe, it, expect } from "vitest";
import { OperationalTask } from "./OperationalTask";

describe("OperationalTask", () => {
  function makeTask() {
    return OperationalTask.create("event-1", "Set up projector", "High");
  }

  it("creates with Todo status", () => {
    const t = makeTask();
    expect(t.status).toBe("Todo");
    expect(t.priority).toBe("High");
  });

  it("follows lifecycle: Todo → InProgress → Completed", () => {
    const t = makeTask();
    t.start();
    expect(t.status).toBe("InProgress");
    t.complete();
    expect(t.status).toBe("Completed");
  });

  it("supports blocking", () => {
    const t = makeTask();
    t.start();
    t.block();
    expect(t.status).toBe("Blocked");
    t.unblock();
    expect(t.status).toBe("InProgress");
  });

  it("rejects invalid transition", () => {
    const t = makeTask();
    expect(() => t.complete()).toThrow("Cannot transition");
  });

  it("assigns and unassigns users", () => {
    const t = makeTask();
    const a = t.assign("user-1");
    expect(a.userId).toBe("user-1");
    expect(t.assignments).toHaveLength(1);

    t.unassign("user-1");
    expect(t.assignments).toHaveLength(0);
  });

  it("rejects duplicate assignment", () => {
    const t = makeTask();
    t.assign("user-1");
    expect(() => t.assign("user-1")).toThrow("already assigned");
  });

  it("manages dependencies", () => {
    const t = makeTask();
    t.addDependency("task-2");
    expect(t.dependsOn).toContain("task-2");
    t.removeDependency("task-2");
    expect(t.dependsOn).toHaveLength(0);
  });

  it("prevents self-dependency", () => {
    const t = makeTask();
    expect(() => t.addDependency(t.id)).toThrow("itself");
  });

  it("manages checklist items", () => {
    const t = makeTask();
    const item = t.addChecklistItem("Bring cables");
    expect(item.done).toBe(false);
    t.toggleChecklistItem(item.id);
    expect(t.checklistItems[0]!.done).toBe(true);
  });

  it("completes assignments on task completion", () => {
    const t = makeTask();
    t.assign("user-1");
    t.start();
    t.complete();
    expect(t.assignments[0]!.completedAt).toBeTruthy();
  });

  it("cancels from any non-terminal state", () => {
    const t = makeTask();
    t.cancel();
    expect(t.status).toBe("Cancelled");
  });
});
