import { randomUUID } from "node:crypto";
import type { AssignmentStatus } from "../valueObjects/AssignmentStatus";

export interface RoleAssignmentProps {
  id: string;
  roleId: string;
  userId: string;
  status: AssignmentStatus;
  assignedAt: Date;
  removedAt: Date | null;
}

export class RoleAssignment {
  readonly id: string;
  readonly roleId: string;
  readonly userId: string;
  status: AssignmentStatus;
  readonly assignedAt: Date;
  removedAt: Date | null;

  constructor(props: RoleAssignmentProps) {
    this.id = props.id;
    this.roleId = props.roleId;
    this.userId = props.userId;
    this.status = props.status;
    this.assignedAt = props.assignedAt;
    this.removedAt = props.removedAt;
  }

  static create(roleId: string, userId: string): RoleAssignment {
    return new RoleAssignment({
      id: randomUUID(),
      roleId,
      userId,
      status: "Active",
      assignedAt: new Date(),
      removedAt: null,
    });
  }

  resign(): void {
    this.status = "Resigned";
    this.removedAt = new Date();
  }

  remove(): void {
    this.status = "Removed";
    this.removedAt = new Date();
  }

  complete(): void {
    this.status = "Completed";
    this.removedAt = new Date();
  }

  get isActive(): boolean {
    return this.status === "Active";
  }
}
