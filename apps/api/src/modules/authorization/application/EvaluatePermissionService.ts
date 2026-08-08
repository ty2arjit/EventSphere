import { PermissionPolicyRepository } from '../domain/PermissionPolicyRepository';
import { ContextLevel } from '../domain/valueObjects/ContextLevel';
import { ResponsibilityReference } from '../domain/valueObjects/ResponsibilityReference';
import { AuthorizationDecision } from '../domain/valueObjects/AuthorizationDecision';

export interface EvaluatePermissionInput {
  permissionName: string;
  contextLevel: ContextLevel;
  contextId: string | null;
  responsibilityRefs: ResponsibilityReference[];
}

export class EvaluatePermissionService {
  constructor(private readonly repository: PermissionPolicyRepository) {}

  async execute(input: EvaluatePermissionInput): Promise<AuthorizationDecision> {
    const policy = await this.repository.load();
    return policy.evaluate(
      input.permissionName,
      input.contextLevel,
      input.contextId,
      input.responsibilityRefs,
    );
  }
}
