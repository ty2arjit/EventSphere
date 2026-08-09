import { PermissionPolicyRepository } from '../domain/PermissionPolicyRepository';
import { PERMISSIONS } from '../domain/permissionNames';

const DESCRIPTIONS: Record<string, string> = {
  [PERMISSIONS.COMMUNITY_MANAGE]: 'Update community profile/settings, manage positions, and send invitations',
  [PERMISSIONS.EVENT_MANAGE]: 'Create, update, and transition events and sessions within a community',
  [PERMISSIONS.COMMITTEE_MANAGE]: 'Manage event committees, roles, and assignments',
  [PERMISSIONS.PARTICIPATION_MANAGE]: 'Manage registration policy, enrollments, attendance, and certificates',
  [PERMISSIONS.TASK_MANAGE]: 'Create, assign, and transition operational tasks',
  [PERMISSIONS.ANNOUNCEMENT_MANAGE]: 'Create, publish, and manage announcements',
  [PERMISSIONS.AUTHORIZATION_MANAGE]: 'Create and revoke permission grants within a community or event',
};

/**
 * Idempotent bootstrap — ensures the canonical permission set exists so grants
 * can be attached to CommunityPosition/CommitteeRole via the Authorization API
 * without a separate seeding step. Safe to run on every server start.
 */
export async function seedDefaultPermissions(repository: PermissionPolicyRepository): Promise<void> {
  const policy = await repository.load();
  let changed = false;

  for (const name of Object.values(PERMISSIONS)) {
    if (!policy.findPermissionByName(name)) {
      policy.addPermission(name, DESCRIPTIONS[name] ?? null);
      changed = true;
    }
  }

  if (changed) {
    await repository.save(policy);
  }
}
