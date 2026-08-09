import type { OperationalTask } from "../domain/OperationalTask";
import type { OperationalTaskRepository } from "../domain/OperationalTaskRepository";

export class InMemoryOperationalTaskRepository implements OperationalTaskRepository {
  private readonly store = new Map<string, OperationalTask>();

  async findById(id: string): Promise<OperationalTask | null> {
    return this.store.get(id) ?? null;
  }

  async findByEventId(eventId: string): Promise<OperationalTask[]> {
    return [...this.store.values()].filter((t) => t.eventId === eventId);
  }

  async save(task: OperationalTask): Promise<void> {
    this.store.set(task.id, task);
  }

  async update(task: OperationalTask): Promise<void> {
    this.store.set(task.id, task);
  }
}
