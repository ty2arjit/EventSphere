import type { OperationalTaskRepository } from "../domain/OperationalTaskRepository";
import type { EventPublisher } from "../../../shared/events/EventPublisher";
import { OperationalTask } from "../domain/OperationalTask";
import type { TaskPriority } from "../domain/valueObjects/TaskPriority";
import { createDomainEvent } from "../../../shared/events/DomainEvent";
import { TaskNotFoundError } from "../domain/errors";

export class ManageTaskService {
  constructor(
    private readonly repo: OperationalTaskRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async create(
    eventId: string,
    title: string,
    priority: TaskPriority = "Medium",
    committeeRoleId: string | null = null,
  ): Promise<OperationalTask> {
    const task = OperationalTask.create(eventId, title, priority, committeeRoleId);
    await this.repo.save(task);
    await this.publisher.publish(
      createDomainEvent({ eventType: "TaskCreated", aggregateId: task.id, aggregateType: "OperationalTask", payload: { eventId, title } }),
    );
    return task;
  }

  async transition(taskId: string, action: "start" | "block" | "unblock" | "complete" | "cancel"): Promise<void> {
    const task = await this.load(taskId);
    task[action]();
    await this.repo.update(task);
  }

  async assign(taskId: string, userId: string) {
    const task = await this.load(taskId);
    const assignment = task.assign(userId);
    await this.repo.update(task);
    return assignment;
  }

  async unassign(taskId: string, userId: string): Promise<void> {
    const task = await this.load(taskId);
    task.unassign(userId);
    await this.repo.update(task);
  }

  async update(
    taskId: string,
    data: { title: string; description: string | null; priority: TaskPriority; dueDate: string | null },
  ): Promise<void> {
    const task = await this.load(taskId);
    task.updateProfile(data.title, data.description, data.priority, data.dueDate ? new Date(data.dueDate) : null);
    await this.repo.update(task);
  }

  async addChecklistItem(taskId: string, label: string) {
    const task = await this.load(taskId);
    const item = task.addChecklistItem(label);
    await this.repo.update(task);
    return item;
  }

  async toggleChecklistItem(taskId: string, itemId: string): Promise<void> {
    const task = await this.load(taskId);
    task.toggleChecklistItem(itemId);
    await this.repo.update(task);
  }

  async listByEvent(eventId: string): Promise<OperationalTask[]> {
    return this.repo.findByEventId(eventId);
  }

  async getById(taskId: string): Promise<OperationalTask> {
    return this.load(taskId);
  }

  private async load(id: string): Promise<OperationalTask> {
    const task = await this.repo.findById(id);
    if (!task) throw new TaskNotFoundError(id);
    return task;
  }
}
