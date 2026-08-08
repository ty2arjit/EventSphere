import { PermissionPolicyRepository } from '../domain/PermissionPolicyRepository';

export interface CreatePermissionInput {
  name: string;
  description: string | null;
}

export interface UpdatePermissionInput {
  id: string;
  name: string;
  description: string | null;
}

export class ManagePermissionService {
  constructor(private readonly repository: PermissionPolicyRepository) {}

  async create(input: CreatePermissionInput): Promise<{ permissionId: string }> {
    const policy = await this.repository.load();
    const permission = policy.addPermission(input.name, input.description);
    await this.repository.save(policy);
    return { permissionId: permission.id };
  }

  async update(input: UpdatePermissionInput): Promise<void> {
    const policy = await this.repository.load();
    policy.updatePermission(input.id, input.name, input.description);
    await this.repository.save(policy);
  }

  async list(): Promise<Array<{ id: string; name: string; description: string | null }>> {
    const policy = await this.repository.load();
    return policy.permissions.map((p) => ({ id: p.id, name: p.name, description: p.description }));
  }
}
