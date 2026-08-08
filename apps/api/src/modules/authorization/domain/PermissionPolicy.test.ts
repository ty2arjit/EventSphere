import { describe, it, expect } from 'vitest';
import { PermissionPolicy } from './PermissionPolicy';
import { PermissionAlreadyExistsError, PermissionNotFoundError, GrantNotFoundError } from './errors';

describe('PermissionPolicy', () => {
  function freshPolicy() {
    return PermissionPolicy.createDefault();
  }

  describe('permissions', () => {
    it('adds a permission', () => {
      const policy = freshPolicy();
      const p = policy.addPermission('manage_events', null);
      expect(p.name).toBe('manage_events');
      expect(policy.permissions).toHaveLength(1);
    });

    it('rejects duplicate permission name (case-insensitive)', () => {
      const policy = freshPolicy();
      policy.addPermission('manage_events', null);
      expect(() => policy.addPermission('Manage_Events', null))
        .toThrow(PermissionAlreadyExistsError);
    });

    it('updates a permission', () => {
      const policy = freshPolicy();
      const p = policy.addPermission('old_name', null);
      policy.updatePermission(p.id, 'new_name', 'desc');
      expect(policy.permissions[0]!.name).toBe('new_name');
      expect(policy.permissions[0]!.description).toBe('desc');
    });

    it('throws on update of non-existent permission', () => {
      const policy = freshPolicy();
      expect(() => policy.updatePermission('nope', 'x', null))
        .toThrow(PermissionNotFoundError);
    });

    it('findPermissionByName returns undefined for missing', () => {
      expect(freshPolicy().findPermissionByName('x')).toBeUndefined();
    });
  });

  describe('grants', () => {
    it('grants a permission to a responsibility reference', () => {
      const policy = freshPolicy();
      const p = policy.addPermission('manage_events', null);
      const g = policy.grantPermission(p.id, 'Community', 'comm-1', {
        type: 'CommunityPosition',
        id: 'pos-president',
      });
      expect(g.isActive).toBe(true);
      expect(policy.activeGrants).toHaveLength(1);
    });

    it('throws when granting for non-existent permission', () => {
      const policy = freshPolicy();
      expect(() =>
        policy.grantPermission('bad-id', 'Platform', null, {
          type: 'PlatformAdmin',
          id: 'admin-1',
        }),
      ).toThrow(PermissionNotFoundError);
    });

    it('revokes a grant', () => {
      const policy = freshPolicy();
      const p = policy.addPermission('edit_community', null);
      const g = policy.grantPermission(p.id, 'Community', 'c1', {
        type: 'CommunityPosition',
        id: 'pos-1',
      });
      policy.revokeGrant(g.id);
      expect(policy.activeGrants).toHaveLength(0);
    });

    it('throws when revoking non-existent grant', () => {
      expect(() => freshPolicy().revokeGrant('nope'))
        .toThrow(GrantNotFoundError);
    });
  });

  describe('evaluate — Deny is default', () => {
    it('denies when no permissions exist', () => {
      const decision = freshPolicy().evaluate('anything', 'Platform', null, [
        { type: 'PlatformAdmin', id: 'a' },
      ]);
      expect(decision).toBe('Deny');
    });

    it('denies when permission exists but no grants match', () => {
      const policy = freshPolicy();
      policy.addPermission('manage_events', null);
      const decision = policy.evaluate('manage_events', 'Platform', null, [
        { type: 'PlatformAdmin', id: 'a' },
      ]);
      expect(decision).toBe('Deny');
    });

    it('allows when an active grant matches', () => {
      const policy = freshPolicy();
      const p = policy.addPermission('manage_events', null);
      policy.grantPermission(p.id, 'Community', 'c1', {
        type: 'CommunityPosition',
        id: 'president',
      });
      const decision = policy.evaluate('manage_events', 'Community', 'c1', [
        { type: 'CommunityPosition', id: 'president' },
      ]);
      expect(decision).toBe('Allow');
    });

    it('denies when grant is revoked', () => {
      const policy = freshPolicy();
      const p = policy.addPermission('manage_events', null);
      const g = policy.grantPermission(p.id, 'Community', 'c1', {
        type: 'CommunityPosition',
        id: 'president',
      });
      policy.revokeGrant(g.id);
      const decision = policy.evaluate('manage_events', 'Community', 'c1', [
        { type: 'CommunityPosition', id: 'president' },
      ]);
      expect(decision).toBe('Deny');
    });

    it('denies when responsibility reference does not match', () => {
      const policy = freshPolicy();
      const p = policy.addPermission('manage_events', null);
      policy.grantPermission(p.id, 'Community', 'c1', {
        type: 'CommunityPosition',
        id: 'president',
      });
      const decision = policy.evaluate('manage_events', 'Community', 'c1', [
        { type: 'CommunityPosition', id: 'secretary' },
      ]);
      expect(decision).toBe('Deny');
    });

    it('denies when context level does not match', () => {
      const policy = freshPolicy();
      const p = policy.addPermission('manage_events', null);
      policy.grantPermission(p.id, 'Community', 'c1', {
        type: 'CommunityPosition',
        id: 'president',
      });
      const decision = policy.evaluate('manage_events', 'Platform', null, [
        { type: 'CommunityPosition', id: 'president' },
      ]);
      expect(decision).toBe('Deny');
    });

    it('allows when grant has null contextId (wildcard)', () => {
      const policy = freshPolicy();
      const p = policy.addPermission('platform_admin', null);
      policy.grantPermission(p.id, 'Platform', null, {
        type: 'PlatformAdmin',
        id: 'admin-role',
      });
      const decision = policy.evaluate('platform_admin', 'Platform', null, [
        { type: 'PlatformAdmin', id: 'admin-role' },
      ]);
      expect(decision).toBe('Allow');
    });

    it('allows when any of multiple responsibility refs matches', () => {
      const policy = freshPolicy();
      const p = policy.addPermission('manage_events', null);
      policy.grantPermission(p.id, 'Community', 'c1', {
        type: 'CommunityPosition',
        id: 'treasurer',
      });
      const decision = policy.evaluate('manage_events', 'Community', 'c1', [
        { type: 'CommunityPosition', id: 'president' },
        { type: 'CommunityPosition', id: 'treasurer' },
      ]);
      expect(decision).toBe('Allow');
    });

    it('permissions are never assigned directly to users — only via responsibility references', () => {
      const policy = freshPolicy();
      const p = policy.addPermission('manage_events', null);
      policy.grantPermission(p.id, 'Community', 'c1', {
        type: 'CommunityPosition',
        id: 'president',
      });
      const decision = policy.evaluate('manage_events', 'Community', 'c1', []);
      expect(decision).toBe('Deny');
    });
  });
});
