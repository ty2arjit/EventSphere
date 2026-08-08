import type { EventCommittee } from "../../domain/EventCommittee";
import type { CommitteeResponseDto } from "../dto/CommitteeResponseDto";

export function toCommitteeResponse(c: EventCommittee): CommitteeResponseDto {
  return {
    id: c.id,
    eventId: c.eventId,
    communityId: c.communityId,
    name: c.name,
    state: c.state,
    roles: c.roles.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      reportsToRoleId: r.reportsToRoleId,
      activeAssignees: c.getActiveAssignmentsForRole(r.id).length,
    })),
    assignments: c.assignments.map((a) => ({
      id: a.id,
      roleId: a.roleId,
      userId: a.userId,
      status: a.status,
      assignedAt: a.assignedAt.toISOString(),
      removedAt: a.removedAt?.toISOString() ?? null,
    })),
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  };
}
