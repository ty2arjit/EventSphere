import { randomUUID } from "node:crypto";
import {
  type CommitteeLifecycleState,
  canTransitionCommittee,
  isTerminalCommitteeState,
} from "./valueObjects/CommitteeLifecycleState";
import { CommitteeRole } from "./entities/CommitteeRole";
import { RoleAssignment } from "./entities/RoleAssignment";

export interface EventCommitteeProps {
  id: string;
  eventId: string;
  communityId: string;
  name: string;
  state: CommitteeLifecycleState;
  roles: CommitteeRole[];
  assignments: RoleAssignment[];
  createdAt: Date;
  updatedAt: Date;
}

export class EventCommittee {
  readonly id: string;
  readonly eventId: string;
  readonly communityId: string;
  name: string;
  state: CommitteeLifecycleState;
  roles: CommitteeRole[];
  assignments: RoleAssignment[];
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: EventCommitteeProps) {
    this.id = props.id;
    this.eventId = props.eventId;
    this.communityId = props.communityId;
    this.name = props.name;
    this.state = props.state;
    this.roles = props.roles;
    this.assignments = props.assignments;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(eventId: string, communityId: string, name: string): EventCommittee {
    return new EventCommittee({
      id: randomUUID(),
      eventId,
      communityId,
      name,
      state: "Planning",
      roles: [],
      assignments: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  private ensureWritable(): void {
    if (isTerminalCommitteeState(this.state)) {
      throw new Error(`Committee is in terminal state "${this.state}" and cannot be modified`);
    }
  }

  private transition(target: CommitteeLifecycleState): void {
    if (!canTransitionCommittee(this.state, target)) {
      throw new Error(`Cannot transition committee from "${this.state}" to "${target}"`);
    }
    this.state = target;
    this.updatedAt = new Date();
  }

  startFormation(): void {
    this.transition("Formation");
  }

  activate(): void {
    this.transition("Active");
  }

  complete(): void {
    this.assignments
      .filter((a) => a.isActive)
      .forEach((a) => a.complete());
    this.transition("Completed");
  }

  archive(): void {
    this.transition("Archived");
  }

  addRole(name: string, description: string | null = null): CommitteeRole {
    this.ensureWritable();
    const exists = this.roles.some(
      (r) => r.name.toLowerCase() === name.toLowerCase(),
    );
    if (exists) throw new Error(`Role "${name}" already exists in this committee`);
    const role = CommitteeRole.create(name, description);
    this.roles.push(role);
    this.updatedAt = new Date();
    return role;
  }

  updateRole(roleId: string, name: string, description: string | null): void {
    this.ensureWritable();
    const role = this.findRole(roleId);
    const duplicate = this.roles.some(
      (r) => r.id !== roleId && r.name.toLowerCase() === name.toLowerCase(),
    );
    if (duplicate) throw new Error(`Role "${name}" already exists in this committee`);
    role.update(name, description);
    this.updatedAt = new Date();
  }

  setReportingRelation(roleId: string, reportsToRoleId: string | null): void {
    this.ensureWritable();
    const role = this.findRole(roleId);
    if (reportsToRoleId !== null) {
      this.findRole(reportsToRoleId);
      if (roleId === reportsToRoleId) throw new Error("A role cannot report to itself");
      if (this.wouldCreateCycle(roleId, reportsToRoleId)) {
        throw new Error("Circular reporting structures are prohibited");
      }
    }
    role.setReportsTo(reportsToRoleId);
    this.updatedAt = new Date();
  }

  assignMember(roleId: string, userId: string): RoleAssignment {
    this.ensureWritable();
    this.findRole(roleId);
    const existing = this.assignments.find(
      (a) => a.roleId === roleId && a.userId === userId && a.isActive,
    );
    if (existing) throw new Error("User is already assigned to this role");
    const assignment = RoleAssignment.create(roleId, userId);
    this.assignments.push(assignment);
    this.updatedAt = new Date();
    return assignment;
  }

  removeAssignment(assignmentId: string): void {
    this.ensureWritable();
    const assignment = this.assignments.find((a) => a.id === assignmentId);
    if (!assignment) throw new Error("Assignment not found");
    if (!assignment.isActive) throw new Error("Assignment is not active");
    assignment.remove();
    this.updatedAt = new Date();
  }

  getActiveAssignmentsForRole(roleId: string): RoleAssignment[] {
    return this.assignments.filter((a) => a.roleId === roleId && a.isActive);
  }

  getUserRoles(userId: string): CommitteeRole[] {
    const roleIds = this.assignments
      .filter((a) => a.userId === userId && a.isActive)
      .map((a) => a.roleId);
    return this.roles.filter((r) => roleIds.includes(r.id));
  }

  private findRole(roleId: string): CommitteeRole {
    const role = this.roles.find((r) => r.id === roleId);
    if (!role) throw new Error(`Role "${roleId}" not found`);
    return role;
  }

  private wouldCreateCycle(roleId: string, proposedParentId: string): boolean {
    let currentId: string | null = proposedParentId;
    const visited = new Set<string>();
    while (currentId !== null) {
      if (currentId === roleId) return true;
      if (visited.has(currentId)) return true;
      visited.add(currentId);
      const parent = this.roles.find((r) => r.id === currentId);
      currentId = parent?.reportsToRoleId ?? null;
    }
    return false;
  }
}
