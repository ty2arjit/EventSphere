import { describe, expect, it } from "vitest";
import { CachedPermissionPolicyRepository } from "./CachedPermissionPolicyRepository";
import { InMemoryPermissionPolicyRepository } from "../test-support/InMemoryPermissionPolicyRepository";
import { FakeCacheClient } from "../../../shared/cache/FakeCacheClient";
import type { CacheClient } from "../../../shared/cache/CacheClient";

describe("CachedPermissionPolicyRepository", () => {
  it("passes through to the inner repository when no cache is configured", async () => {
    const inner = new InMemoryPermissionPolicyRepository();
    const repo = new CachedPermissionPolicyRepository(inner, null);

    const policy = await repo.load();
    policy.addPermission("event:manage", null);
    await repo.save(policy);

    const reloaded = await repo.load();
    expect(reloaded.findPermissionByName("event:manage")).toBeDefined();
  });

  it("caches load() and serves subsequent reads from the cache", async () => {
    const inner = new InMemoryPermissionPolicyRepository();
    const cache = new FakeCacheClient();
    const repo = new CachedPermissionPolicyRepository(inner, cache);

    const first = await repo.load();
    first.addPermission("event:manage", "Manage events");
    await inner.save(first); // bypasses the decorator's own save(), simulating a write it didn't see

    const second = await repo.load(); // should still be the cached (stale) read

    expect(second.findPermissionByName("event:manage")).toBeUndefined();
    expect(cache.getCalls).toBeGreaterThan(0);
  });

  it("invalidates the cache on save(), so a grant/revoke is visible on the next load()", async () => {
    const inner = new InMemoryPermissionPolicyRepository();
    const cache = new FakeCacheClient();
    const repo = new CachedPermissionPolicyRepository(inner, cache);

    const policy = await repo.load();
    const permission = policy.addPermission("event:manage", null);
    await repo.save(policy); // must invalidate

    const grant = policy.grantPermission(permission.id, "Platform", null, {
      type: "CommunityPosition",
      id: "position-1",
    });
    await repo.save(policy); // must invalidate again

    const reloaded = await repo.load();
    const found = reloaded.grants.find((g) => g.id === grant.id);
    expect(found).toBeDefined();
    expect(found?.isActive).toBe(true);

    reloaded.revokeGrant(grant.id);
    await repo.save(reloaded); // must invalidate — a stale cache here would keep the revoked grant "Allow"-ing

    const afterRevoke = await repo.load();
    expect(afterRevoke.grants.find((g) => g.id === grant.id)?.isActive).toBe(false);
  });

  it("round-trips dates correctly through the cache", async () => {
    const inner = new InMemoryPermissionPolicyRepository();
    const cache = new FakeCacheClient();
    const repo = new CachedPermissionPolicyRepository(inner, cache);

    const policy = await repo.load();
    policy.addPermission("event:manage", null);
    await repo.save(policy);

    const cached = await repo.load(); // first call after save() is a cache miss, populates cache
    const cachedAgain = await repo.load(); // this one is a genuine cache hit

    expect(cachedAgain.createdAt).toBeInstanceOf(Date);
    expect(cachedAgain.permissions[0]?.createdAt).toBeInstanceOf(Date);
    expect(cachedAgain.createdAt.getTime()).toBe(cached.createdAt.getTime());
  });

  it("does not let a corrupt cache entry break reads", async () => {
    const inner = new InMemoryPermissionPolicyRepository();
    const policy = await inner.load();
    policy.addPermission("event:manage", null);
    await inner.save(policy);

    const cache: CacheClient = {
      get: async () => "not valid json",
      set: async () => undefined,
      del: async () => undefined,
    };
    const repo = new CachedPermissionPolicyRepository(inner, cache);

    const result = await repo.load();

    expect(result.findPermissionByName("event:manage")).toBeDefined();
  });
});
