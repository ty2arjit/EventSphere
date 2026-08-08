import { randomUUID } from "node:crypto";
import { type TaskStatus, canTransitionTask } from "./valueObjects/TaskStatus";
import type { TaskPriority } from "./valueObjects/TaskPriority";

export interface TaskAssignment {
  id: string;
  userId: string;
  assignedAt: Date;
  completedAt: Date | null;
}

export interface OperationalTaskProps {
  id: string;
  eventId: string;
  committeeRoleId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  assignments: TaskAssignment[];
  dependsOn: string[];
  checklistItems: Array<{ id: string; label: string; done: boolean }>;
  createdAt: Date;
  updatedAt: Date;
}

export class OperationalTask {
  readonly id: string;
  readonly eventId: string;
  committeeRoleId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  assignments: TaskAssignment[];
  dependsOn: string[];
  checklistItems: Array<{ id: string; label: string; done: boolean }>;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: OperationalTaskProps) {
    this.id = props.id;
    this.eventId = props.eventId;
    this.committeeRoleId = props.committeeRoleId;
    this.title = props.title;
    this.description = props.description;
    this.status = props.status;
    this.priority = props.priority;
    this.dueDate = props.dueDate;
    this.assignments = props.assignments;
    this.dependsOn = props.dependsOn;
    this.checklistItems = props.checklistItems;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    eventId: string,
    title: string,
    priority: TaskPriority = "Medium",
    committeeRoleId: string | null = null,
  ): OperationalTask {
    return new OperationalTask({
      id: randomUUID(),
      eventId,
      committeeRoleId,
      title,
      description: null,
      status: "Todo",
      priority,
      dueDate: null,
      assignments: [],
      dependsOn: [],
      checklistItems: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  private transition(target: TaskStatus): void {
    if (!canTransitionTask(this.status, target)) {
      throw new Error(`Cannot transition task from "${this.status}" to "${target}"`);
    }
    this.status = target;
    this.updatedAt = new Date();
  }

  start(): void { this.transition("InProgress"); }
  block(): void { this.transition("Blocked"); }
  unblock(): void { this.transition("InProgress"); }
  complete(): void {
    this.assignments.filter((a) => !a.completedAt).forEach((a) => (a.completedAt = new Date()));
    this.transition("Completed");
  }
  cancel(): void { this.transition("Cancelled"); }

  assign(userId: string): TaskAssignment {
    const existing = this.assignments.find((a) => a.userId === userId && !a.completedAt);
    if (existing) throw new Error("User is already assigned to this task");
    const assignment: TaskAssignment = {
      id: randomUUID(),
      userId,
      assignedAt: new Date(),
      completedAt: null,
    };
    this.assignments.push(assignment);
    this.updatedAt = new Date();
    return assignment;
  }

  unassign(userId: string): void {
    const idx = this.assignments.findIndex((a) => a.userId === userId && !a.completedAt);
    if (idx === -1) throw new Error("User is not assigned to this task");
    this.assignments.splice(idx, 1);
    this.updatedAt = new Date();
  }

  addDependency(taskId: string): void {
    if (taskId === this.id) throw new Error("A task cannot depend on itself");
    if (this.dependsOn.includes(taskId)) throw new Error("Dependency already exists");
    this.dependsOn.push(taskId);
    this.updatedAt = new Date();
  }

  removeDependency(taskId: string): void {
    this.dependsOn = this.dependsOn.filter((id) => id !== taskId);
    this.updatedAt = new Date();
  }

  addChecklistItem(label: string): { id: string; label: string; done: boolean } {
    const item = { id: randomUUID(), label, done: false };
    this.checklistItems.push(item);
    this.updatedAt = new Date();
    return item;
  }

  toggleChecklistItem(itemId: string): void {
    const item = this.checklistItems.find((i) => i.id === itemId);
    if (!item) throw new Error("Checklist item not found");
    item.done = !item.done;
    this.updatedAt = new Date();
  }

  updateProfile(title: string, description: string | null, priority: TaskPriority, dueDate: Date | null): void {
    this.title = title;
    this.description = description;
    this.priority = priority;
    this.dueDate = dueDate;
    this.updatedAt = new Date();
  }
}
