import { PermissionPolicyRepository } from '../domain/PermissionPolicyRepository';
import { PermissionPolicy, PermissionPolicyProps } from '../domain/PermissionPolicy';

export class InMemoryPermissionPolicyRepository implements PermissionPolicyRepository {
  private stored: PermissionPolicyProps | null = null;

  async load(): Promise<PermissionPolicy> {
    if (!this.stored) return PermissionPolicy.createDefault();
    return PermissionPolicy.fromPersistence({ ...this.stored });
  }

  async save(policy: PermissionPolicy): Promise<void> {
    this.stored = {
      id: policy.id,
      permissions: [...policy.permissions],
      grants: [...policy.grants],
      createdAt: policy.createdAt,
      updatedAt: policy.updatedAt,
    };
  }
}
