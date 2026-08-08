import { PermissionPolicyRepository } from '../domain/PermissionPolicyRepository';
import { ContextLevel } from '../domain/valueObjects/ContextLevel';
import { ResponsibilityReference } from '../domain/valueObjects/ResponsibilityReference';

export interface CreateGrantInput {
  permissionId: string;
  contextLevel: ContextLevel;
  contextId: string | null;
  responsibilityRef: ResponsibilityReference;
}

export class ManageGrantService {
  constructor(private readonly repository: PermissionPolicyRepository) {}

  async grant(input: CreateGrantInput): Promise<{ grantId: string }> {
    const policy = await this.repository.load();
    const grant = policy.grantPermission(
      input.permissionId,
      input.contextLevel,
      input.contextId,
      input.responsibilityRef,
    );
    await this.repository.save(policy);
    return { grantId: grant.id };
  }

  async revoke(grantId: string): Promise<void> {
    const policy = await this.repository.load();
    policy.revokeGrant(grantId);
    await this.repository.save(policy);
  }

  async listActive(): Promise<Array<{
    id: string;
    permissionId: string;
    contextLevel: string;
    contextId: string | null;
    responsibilityRef: ResponsibilityReference;
  }>> {
    const policy = await this.repository.load();
    return policy.activeGrants.map((g) => ({
      id: g.id,
      permissionId: g.permissionId,
      contextLevel: g.contextLevel,
      contextId: g.contextId,
      responsibilityRef: g.responsibilityRef,
    }));
  }
}
