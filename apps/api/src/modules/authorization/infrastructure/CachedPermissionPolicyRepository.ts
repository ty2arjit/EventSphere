import type { PermissionPolicyRepository } from "../domain/PermissionPolicyRepository";
import { PermissionPolicy, type PermissionPolicyProps } from "../domain/PermissionPolicy";
import { Permission, type PermissionProps } from "../domain/entities/Permission";
import { PermissionGrant, type PermissionGrantProps } from "../domain/entities/PermissionGrant";
import { logger } from "../../../shared/logger";
import type { CacheClient } from "../../../shared/cache/CacheClient";

const POLICY_CACHE_KEY = "authz:policy";
// The invalidate-on-save() path below is what actually keeps this correct —
// every mutation in this module (grant, revoke, create/update permission,
// the startup seeder) goes through this repository's save(), so the cache
// is deleted the instant the policy changes. This TTL is a safety net for
// the case that invariant is ever violated (e.g. a manual DB edit), not the
// primary correctness mechanism — kept short specifically because this is
// the authorization policy: a long-lived accidental stale "Allow" here is a
// real security bug, not just a UX staleness issue.
const POLICY_TTL_SECONDS = 300;

type SerializedGrant = Omit<PermissionGrantProps, "grantedAt" | "revokedAt"> & {
  grantedAt: string;
  revokedAt: string | null;
};
type SerializedPermission = Omit<PermissionProps, "createdAt"> & { createdAt: string };
interface SerializedPolicy {
  id: string;
  createdAt: string;
  updatedAt: string;
  permissions: SerializedPermission[];
  grants: SerializedGrant[];
}

/**
 * Caches the single PermissionPolicy aggregate — loaded on every
 * authorization check across the entire app (AuthorizeResourceActionService
 * calls repository.load() on every permission-gated request), so this is
 * the busiest read in the system. Removes two `findMany` queries
 * (permissions + grants) from that hot path.
 *
 * Inert (pure passthrough) when constructed with a null cache, same pattern
 * as CachedMetricRepository. Cache failures are swallowed and fall through
 * to the real repository — never surfaced as an authorization failure.
 */
export class CachedPermissionPolicyRepository implements PermissionPolicyRepository {
  constructor(
    private readonly inner: PermissionPolicyRepository,
    private readonly cache: CacheClient | null,
  ) {}

  async load(): Promise<PermissionPolicy> {
    if (!this.cache) return this.inner.load();

    const cached = await this.safeGet();
    if (cached) {
      try {
        return this.deserialize(JSON.parse(cached) as SerializedPolicy);
      } catch (err) {
        logger.warn({ err }, "Failed to parse cached permission policy — falling through to DB");
      }
    }

    const policy = await this.inner.load();
    await this.safeSet(this.serialize(policy));
    return policy;
  }

  async save(policy: PermissionPolicy): Promise<void> {
    await this.inner.save(policy);
    // Invalidate rather than overwrite-in-place: `policy` here may not
    // reflect the full persisted state (e.g. concurrent writers), so the
    // safe move is to force the next load() to go back to Postgres.
    await this.safeDel();
  }

  private serialize(policy: PermissionPolicy): SerializedPolicy {
    return {
      id: policy.id,
      createdAt: policy.createdAt.toISOString(),
      updatedAt: policy.updatedAt.toISOString(),
      permissions: policy.permissions.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        createdAt: p.createdAt.toISOString(),
      })),
      grants: policy.grants.map((g) => ({
        id: g.id,
        permissionId: g.permissionId,
        contextLevel: g.contextLevel,
        contextId: g.contextId,
        responsibilityRef: g.responsibilityRef,
        grantedAt: g.grantedAt.toISOString(),
        revokedAt: g.revokedAt ? g.revokedAt.toISOString() : null,
      })),
    };
  }

  private deserialize(raw: SerializedPolicy): PermissionPolicy {
    const props: PermissionPolicyProps = {
      id: raw.id,
      createdAt: new Date(raw.createdAt),
      updatedAt: new Date(raw.updatedAt),
      permissions: raw.permissions.map((p) =>
        Permission.fromPersistence({ ...p, createdAt: new Date(p.createdAt) }),
      ),
      grants: raw.grants.map((g) =>
        PermissionGrant.fromPersistence({
          ...g,
          grantedAt: new Date(g.grantedAt),
          revokedAt: g.revokedAt ? new Date(g.revokedAt) : null,
        }),
      ),
    };
    return PermissionPolicy.fromPersistence(props);
  }

  private async safeGet(): Promise<string | null> {
    try {
      return await this.cache!.get(POLICY_CACHE_KEY);
    } catch (err) {
      logger.warn({ err }, "Redis GET failed — falling through to DB for permission policy");
      return null;
    }
  }

  private async safeSet(policy: SerializedPolicy): Promise<void> {
    try {
      await this.cache!.set(POLICY_CACHE_KEY, JSON.stringify(policy), "EX", POLICY_TTL_SECONDS);
    } catch (err) {
      logger.warn({ err }, "Redis SET failed — continuing without caching the permission policy");
    }
  }

  private async safeDel(): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.del(POLICY_CACHE_KEY);
    } catch (err) {
      // This is the one that actually matters: a failed invalidation means
      // a stale policy (possibly containing a just-revoked grant) can keep
      // serving "Allow" for up to POLICY_TTL_SECONDS. Logged at error, not
      // warn, so it's visible — this is the failure mode worth paging on.
      logger.error({ err }, "Redis DEL failed after a permission policy change — stale grants may serve for up to the TTL");
    }
  }
}
