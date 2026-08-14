import { describe, expect, it } from "vitest";
import { CachedMetricRepository } from "./CachedMetricRepository";
import { Metric } from "../domain/Metric";
import type { MetricRepository } from "../domain/MetricRepository";
import type { CacheClient } from "../../../shared/cache/CacheClient";
import { FakeCacheClient } from "../../../shared/cache/FakeCacheClient";

class InMemoryMetricRepository implements MetricRepository {
  private metrics: Metric[] = [];
  saveCalls = 0;
  findByEntityIdCalls = 0;

  async save(metric: Metric): Promise<void> {
    this.saveCalls += 1;
    this.metrics.push(metric);
  }

  async findByEntityId(entityId: string): Promise<Metric[]> {
    this.findByEntityIdCalls += 1;
    return this.metrics.filter((m) => m.entityId === entityId);
  }

  async findByType(type: string): Promise<Metric[]> {
    return this.metrics.filter((m) => m.type === type);
  }

  async aggregate(entityId: string, type: string) {
    const matching = this.metrics.filter((m) => m.entityId === entityId && m.type === type);
    const sum = matching.reduce((s, m) => s + m.value, 0);
    return { sum, count: matching.length, avg: matching.length ? sum / matching.length : 0 };
  }
}

describe("CachedMetricRepository", () => {
  it("passes through to the inner repository when no cache is configured", async () => {
    const inner = new InMemoryMetricRepository();
    const repo = new CachedMetricRepository(inner, null);
    await repo.save(Metric.record("EnrollmentCount", "event-1", "Event", 1));

    await repo.findByEntityId("event-1");
    await repo.findByEntityId("event-1");

    expect(inner.findByEntityIdCalls).toBe(2);
  });

  it("caches findByEntityId results and serves subsequent reads from the cache", async () => {
    const inner = new InMemoryMetricRepository();
    const cache = new FakeCacheClient();
    const repo = new CachedMetricRepository(inner, cache);
    await inner.save(Metric.record("EnrollmentCount", "event-1", "Event", 5));

    const first = await repo.findByEntityId("event-1");
    const second = await repo.findByEntityId("event-1");

    expect(inner.findByEntityIdCalls).toBe(1);
    expect(second).toHaveLength(1);
    expect(second[0]?.value).toBe(5);
    expect(first[0]?.recordedAt).toBeInstanceOf(Date);
    expect(second[0]?.recordedAt).toBeInstanceOf(Date);
  });

  it("invalidates the affected entity's cache entry on save", async () => {
    const inner = new InMemoryMetricRepository();
    const cache = new FakeCacheClient();
    const repo = new CachedMetricRepository(inner, cache);

    await repo.save(Metric.record("EnrollmentCount", "event-1", "Event", 1));
    await repo.findByEntityId("event-1"); // populates the cache
    await repo.save(Metric.record("EnrollmentCount", "event-1", "Event", 2)); // must invalidate
    const afterSecondSave = await repo.findByEntityId("event-1");

    expect(afterSecondSave).toHaveLength(2);
    expect(inner.findByEntityIdCalls).toBe(2); // second read was a cache miss, not stale data
  });

  it("does not let a corrupt cache entry break reads", async () => {
    const inner = new InMemoryMetricRepository();
    await inner.save(Metric.record("EnrollmentCount", "event-1", "Event", 9));
    const cache: CacheClient = {
      get: async () => "not valid json",
      set: async () => undefined,
      del: async () => undefined,
    };
    const repo = new CachedMetricRepository(inner, cache);

    const result = await repo.findByEntityId("event-1");

    expect(result).toHaveLength(1);
    expect(result[0]?.value).toBe(9);
  });
});
