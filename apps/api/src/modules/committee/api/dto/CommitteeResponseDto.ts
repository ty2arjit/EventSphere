export interface CommitteeRoleDto {
  id: string;
  name: string;
  description: string | null;
  reportsToRoleId: string | null;
  activeAssignees: number;
}

export interface RoleAssignmentDto {
  id: string;
  roleId: string;
  userId: string;
  status: string;
  assignedAt: string;
  removedAt: string | null;
}

export interface CommitteeResponseDto {
  id: string;
  eventId: string;
  communityId: string;
  name: string;
  state: string;
  roles: CommitteeRoleDto[];
  assignments: RoleAssignmentDto[];
  createdAt: string;
  updatedAt: string;
}
