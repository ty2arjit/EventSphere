import { PermissionPolicy } from './PermissionPolicy';

export interface PermissionPolicyRepository {
  load(): Promise<PermissionPolicy>;
  save(policy: PermissionPolicy): Promise<void>;
}
