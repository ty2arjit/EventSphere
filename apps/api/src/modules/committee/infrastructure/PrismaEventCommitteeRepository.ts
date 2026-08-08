import type { PrismaClient } from "@prisma/client";
import type { EventCommitteeRepository } from "../domain/EventCommitteeRepository";
import { EventCommittee } from "../domain/EventCommittee";
import { CommitteeRole } from "../domain/entities/CommitteeRole";
import { RoleAssignment } from "../domain/entities/RoleAssignment";
import type { CommitteeLifecycleState } from "../domain/valueObjects/CommitteeLifecycleState";
import type { AssignmentStatus } from "../domain/valueObjects/AssignmentStatus";

type CommitteeWithRelations = Awaited<
  ReturnType<PrismaClient["eventCommittee"]["findUnique"]>
> & {
  roles: Array<{
    id: string;
    name: string;
    description: string | null;
    reportsToRoleId: string | null;
    createdAt: Date;
  }>;
  assignments: Array<{
    id: string;
    roleId: string;
    userId: string;
    status: string;
    assignedAt: Date;
    removedAt: Date | null;
  }>;
};

function toDomain(row: NonNullable<CommitteeWithRelations>): EventCommittee {
  return new EventCommittee({
    id: row.id,
    eventId: row.eventId,
    communityId: row.communityId,
    name: row.name,
    state: row.state as CommitteeLifecycleState,
    roles: row.roles.map(
      (r) =>
        new CommitteeRole({
          id: r.id,
          name: r.name,
          description: r.description,
          reportsToRoleId: r.reportsToRoleId,
          createdAt: r.createdAt,
        }),
    ),
    assignments: row.assignments.map(
      (a) =>
        new RoleAssignment({
          id: a.id,
          roleId: a.roleId,
          userId: a.userId,
          status: a.status as AssignmentStatus,
          assignedAt: a.assignedAt,
          removedAt: a.removedAt,
        }),
    ),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

const INCLUDE = { roles: true, assignments: true } as const;

export class PrismaEventCommitteeRepository implements EventCommitteeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<EventCommittee | null> {
    const row = await this.prisma.eventCommittee.findUnique({
      where: { id },
      include: INCLUDE,
    });
    return row ? toDomain(row as CommitteeWithRelations) : null;
  }

  async findByEventId(eventId: string): Promise<EventCommittee | null> {
    const row = await this.prisma.eventCommittee.findUnique({
      where: { eventId },
      include: INCLUDE,
    });
    return row ? toDomain(row as CommitteeWithRelations) : null;
  }

  async save(committee: EventCommittee): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.eventCommittee.create({
        data: {
          id: committee.id,
          eventId: committee.eventId,
          communityId: committee.communityId,
          name: committee.name,
          state: committee.state,
        },
      });

      if (committee.roles.length > 0) {
        await tx.committeeRole.createMany({
          data: committee.roles.map((r) => ({
            id: r.id,
            committeeId: committee.id,
            name: r.name,
            description: r.description,
            reportsToRoleId: r.reportsToRoleId,
          })),
        });
      }

      if (committee.assignments.length > 0) {
        await tx.roleAssignment.createMany({
          data: committee.assignments.map((a) => ({
            id: a.id,
            committeeId: committee.id,
            roleId: a.roleId,
            userId: a.userId,
            status: a.status,
            assignedAt: a.assignedAt,
            removedAt: a.removedAt,
          })),
        });
      }
    });
  }

  async update(committee: EventCommittee): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.eventCommittee.update({
        where: { id: committee.id },
        data: {
          name: committee.name,
          state: committee.state,
          updatedAt: committee.updatedAt,
        },
      });

      await tx.committeeRole.deleteMany({ where: { committeeId: committee.id } });
      if (committee.roles.length > 0) {
        await tx.committeeRole.createMany({
          data: committee.roles.map((r) => ({
            id: r.id,
            committeeId: committee.id,
            name: r.name,
            description: r.description,
            reportsToRoleId: r.reportsToRoleId,
          })),
        });
      }

      await tx.roleAssignment.deleteMany({ where: { committeeId: committee.id } });
      if (committee.assignments.length > 0) {
        await tx.roleAssignment.createMany({
          data: committee.assignments.map((a) => ({
            id: a.id,
            committeeId: committee.id,
            roleId: a.roleId,
            userId: a.userId,
            status: a.status,
            assignedAt: a.assignedAt,
            removedAt: a.removedAt,
          })),
        });
      }
    });
  }
}
