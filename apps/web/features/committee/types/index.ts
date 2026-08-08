export interface CommitteeRoleResponse {
  id: string;
  name: string;
  description: string | null;
  reportsToRoleId: string | null;
  activeAssignees: number;
}

export interface RoleAssignmentResponse {
  id: string;
  roleId: string;
  userId: string;
  status: string;
  assignedAt: string;
  removedAt: string | null;
}

export interface CommitteeResponse {
  id: string;
  eventId: string;
  communityId: string;
  name: string;
  state: string;
  roles: CommitteeRoleResponse[];
  assignments: RoleAssignmentResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommitteeInput {
  eventId: string;
  communityId: string;
  name: string;
}
