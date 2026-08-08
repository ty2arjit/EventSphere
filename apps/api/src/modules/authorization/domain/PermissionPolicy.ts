import { randomUUID } from 'node:crypto';
import { DomainEvent } from '../../../shared/events/DomainEvent';
import { Permission } from './entities/Permission';
import { PermissionGrant } from './entities/PermissionGrant';
import { ContextLevel } from './valueObjects/ContextLevel';
import { ResponsibilityReference } from './valueObjects/ResponsibilityReference';
import { AuthorizationDecision } from './valueObjects/AuthorizationDecision';
import { PermissionNotFoundError, PermissionAlreadyExistsError, GrantNotFoundError } from './errors';

export interface PermissionPolicyProps {
  id: string;
  permissions: Permission[];
  grants: PermissionGrant[];
  createdAt: Date;
  updatedAt: Date;
}

export class PermissionPolicy {
  private readonly pendingEvents: DomainEvent[] = [];

  private constructor(private readonly props: PermissionPolicyProps) {}

  static createDefault(): PermissionPolicy {
    return new PermissionPolicy({
      id: 'singleton',
      permissions: [],
      grants: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: PermissionPolicyProps): PermissionPolicy {
    return new PermissionPolicy(props);
  }

  pullDomainEvents(): DomainEvent[] {
    return this.pendingEvents.splice(0, this.pendingEvents.length);
  }

  get id(): string { return this.props.id; }
  get permissions(): readonly Permission[] { return this.props.permissions; }
  get grants(): readonly PermissionGrant[] { return this.props.grants; }
  get activeGrants(): PermissionGrant[] { return this.props.grants.filter((g) => g.isActive); }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  // --- Permissions ---
  addPermission(name: string, description: string | null): Permission {
    const existing = this.props.permissions.find((p) => p.name.toLowerCase() === name.toLowerCase());
    if (existing) throw new PermissionAlreadyExistsError(name);

    const permission = Permission.create(randomUUID(), name, description);
    this.props.permissions.push(permission);
    this.touch();
    return permission;
  }

  updatePermission(id: string, name: string, description: string | null): void {
    const permission = this.props.permissions.find((p) => p.id === id);
    if (!permission) throw new PermissionNotFoundError(id);

    const nameConflict = this.props.permissions.find(
      (p) => p.id !== id && p.name.toLowerCase() === name.toLowerCase(),
    );
    if (nameConflict) throw new PermissionAlreadyExistsError(name);

    permission.update(name, description);
    this.touch();
  }

  findPermissionByName(name: string): Permission | undefined {
    return this.props.permissions.find((p) => p.name === name);
  }

  // --- Grants ---
  grantPermission(
    permissionId: string,
    contextLevel: ContextLevel,
    contextId: string | null,
    responsibilityRef: ResponsibilityReference,
  ): PermissionGrant {
    const permission = this.props.permissions.find((p) => p.id === permissionId);
    if (!permission) throw new PermissionNotFoundError(permissionId);

    const grant = PermissionGrant.create(randomUUID(), permissionId, contextLevel, contextId, responsibilityRef);
    this.props.grants.push(grant);
    this.touch();
    return grant;
  }

  revokeGrant(grantId: string): void {
    const grant = this.props.grants.find((g) => g.id === grantId);
    if (!grant) throw new GrantNotFoundError(grantId);
    grant.revoke();
    this.touch();
  }

  /**
   * Deterministic Allow/Deny evaluation.
   * Deny is default — only returns Allow if at least one active grant matches.
   */
  evaluate(
    permissionName: string,
    contextLevel: ContextLevel,
    contextId: string | null,
    responsibilityRefs: ResponsibilityReference[],
  ): AuthorizationDecision {
    const permission = this.findPermissionByName(permissionName);
    if (!permission) return 'Deny';

    for (const ref of responsibilityRefs) {
      const match = this.activeGrants.find((g) =>
        g.matches(permission.id, contextLevel, contextId, ref),
      );
      if (match) return 'Allow';
    }

    return 'Deny';
  }
}
