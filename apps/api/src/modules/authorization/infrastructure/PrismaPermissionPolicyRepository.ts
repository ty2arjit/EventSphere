import { PrismaClient } from '@prisma/client';
import { PermissionPolicyRepository } from '../domain/PermissionPolicyRepository';
import { PermissionPolicy } from '../domain/PermissionPolicy';
import { Permission } from '../domain/entities/Permission';
import { PermissionGrant } from '../domain/entities/PermissionGrant';
import { ContextLevel } from '../domain/valueObjects/ContextLevel';
import { ResponsibilityReference } from '../domain/valueObjects/ResponsibilityReference';

export class PrismaPermissionPolicyRepository implements PermissionPolicyRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async load(): Promise<PermissionPolicy> {
    const [permissions, grants] = await Promise.all([
      this.prisma.permission.findMany({ orderBy: { createdAt: 'asc' } }),
      this.prisma.permissionGrant.findMany({ orderBy: { grantedAt: 'asc' } }),
    ]);

    if (permissions.length === 0 && grants.length === 0) {
      return PermissionPolicy.createDefault();
    }

    return PermissionPolicy.fromPersistence({
      id: 'singleton',
      permissions: permissions.map((p) =>
        Permission.fromPersistence({
          id: p.id,
          name: p.name,
          description: p.description,
          createdAt: p.createdAt,
        }),
      ),
      grants: grants.map((g) =>
        PermissionGrant.fromPersistence({
          id: g.id,
          permissionId: g.permissionId,
          contextLevel: g.contextLevel as ContextLevel,
          contextId: g.contextId,
          responsibilityRef: {
            type: g.responsibilityType as ResponsibilityReference['type'],
            id: g.responsibilityId,
          },
          grantedAt: g.grantedAt,
          revokedAt: g.revokedAt,
        }),
      ),
      createdAt: permissions[0]?.createdAt ?? new Date(),
      updatedAt: new Date(),
    });
  }

  async save(policy: PermissionPolicy): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const permission of policy.permissions) {
        await tx.permission.upsert({
          where: { id: permission.id },
          create: {
            id: permission.id,
            name: permission.name,
            description: permission.description,
            createdAt: permission.createdAt,
          },
          update: {
            name: permission.name,
            description: permission.description,
          },
        });
      }

      for (const grant of policy.grants) {
        await tx.permissionGrant.upsert({
          where: { id: grant.id },
          create: {
            id: grant.id,
            permissionId: grant.permissionId,
            contextLevel: grant.contextLevel,
            contextId: grant.contextId,
            responsibilityType: grant.responsibilityRef.type,
            responsibilityId: grant.responsibilityRef.id,
            grantedAt: grant.grantedAt,
            revokedAt: grant.revokedAt,
          },
          update: {
            revokedAt: grant.revokedAt,
          },
        });
      }
    });
  }
}
