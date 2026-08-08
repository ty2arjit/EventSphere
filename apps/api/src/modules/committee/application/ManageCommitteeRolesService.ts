import type { EventCommitteeRepository } from "../domain/EventCommitteeRepository";
import { CommitteeNotFoundError } from "../domain/errors";

export class ManageCommitteeRolesService {
  constructor(private readonly repo: EventCommitteeRepository) {}

  async addRole(committeeId: string, name: string, description: string | null = null) {
    const committee = await this.repo.findById(committeeId);
    if (!committee) throw new CommitteeNotFoundError(committeeId);

    const role = committee.addRole(name, description);
    await this.repo.update(committee);
    return role;
  }

  async updateRole(committeeId: string, roleId: string, name: string, description: string | null) {
    const committee = await this.repo.findById(committeeId);
    if (!committee) throw new CommitteeNotFoundError(committeeId);

    committee.updateRole(roleId, name, description);
    await this.repo.update(committee);
  }

  async setReporting(committeeId: string, roleId: string, reportsToRoleId: string | null) {
    const committee = await this.repo.findById(committeeId);
    if (!committee) throw new CommitteeNotFoundError(committeeId);

    committee.setReportingRelation(roleId, reportsToRoleId);
    await this.repo.update(committee);
  }

  async assignMember(committeeId: string, roleId: string, userId: string) {
    const committee = await this.repo.findById(committeeId);
    if (!committee) throw new CommitteeNotFoundError(committeeId);

    const assignment = committee.assignMember(roleId, userId);
    await this.repo.update(committee);
    return assignment;
  }

  async removeAssignment(committeeId: string, assignmentId: string) {
    const committee = await this.repo.findById(committeeId);
    if (!committee) throw new CommitteeNotFoundError(committeeId);

    committee.removeAssignment(assignmentId);
    await this.repo.update(committee);
  }
}
