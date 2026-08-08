import type { PrismaClient } from "@prisma/client";
import type { OperationalTaskRepository } from "../domain/OperationalTaskRepository";
import { OperationalTask, type TaskAssignment } from "../domain/OperationalTask";
import type { TaskStatus } from "../domain/valueObjects/TaskStatus";
import type { TaskPriority } from "../domain/valueObjects/TaskPriority";

function toDomain(row: {
  id: string;
  eventId: string;
  committeeRoleId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: Date | null;
  assignments: unknown;
  dependsOn: unknown;
  checklistItems: unknown;
  createdAt: Date;
  updatedAt: Date;
}): OperationalTask {
  return new OperationalTask({
    id: row.id,
    eventId: row.eventId,
    committeeRoleId: row.committeeRoleId,
    title: row.title,
    description: row.description,
    status: row.status as TaskStatus,
    priority: row.priority as TaskPriority,
    dueDate: row.dueDate,
    assignments: ((row.assignments as TaskAssignment[]) ?? []).map((a) => ({
      ...a,
      assignedAt: new Date(a.assignedAt),
      completedAt: a.completedAt ? new Date(a.completedAt) : null,
    })),
    dependsOn: (row.dependsOn as string[]) ?? [],
    checklistItems: (row.checklistItems as Array<{ id: string; label: string; done: boolean }>) ?? [],
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class PrismaOperationalTaskRepository implements OperationalTaskRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<OperationalTask | null> {
    const row = await this.prisma.operationalTask.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEventId(eventId: string): Promise<OperationalTask[]> {
    const rows = await this.prisma.operationalTask.findMany({ where: { eventId }, orderBy: { createdAt: "asc" } });
    return rows.map(toDomain);
  }

  async save(task: OperationalTask): Promise<void> {
    await this.prisma.operationalTask.create({
      data: {
        id: task.id,
        eventId: task.eventId,
        committeeRoleId: task.committeeRoleId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignments: task.assignments as object[],
        dependsOn: task.dependsOn,
        checklistItems: task.checklistItems as object[],
      },
    });
  }

  async update(task: OperationalTask): Promise<void> {
    await this.prisma.operationalTask.update({
      where: { id: task.id },
      data: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        assignments: task.assignments as object[],
        dependsOn: task.dependsOn,
        checklistItems: task.checklistItems as object[],
        updatedAt: task.updatedAt,
      },
    });
  }
}
