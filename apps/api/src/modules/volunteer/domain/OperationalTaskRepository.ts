import type { OperationalTask } from "./OperationalTask";

export interface OperationalTaskRepository {
  findById(id: string): Promise<OperationalTask | null>;
  findByEventId(eventId: string): Promise<OperationalTask[]>;
  save(task: OperationalTask): Promise<void>;
  update(task: OperationalTask): Promise<void>;
}
