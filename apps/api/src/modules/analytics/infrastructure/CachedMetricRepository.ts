import type { MetricRepository } from "../domain/MetricRepository";
import { Metric, type MetricProps, type MetricType } from "../domain/Metric";
import { logger } from "../../../shared/logger";
import type { CacheClient } from "../../../shared/cache/CacheClient";

export type { CacheClient } from "../../../shared/cache/CacheClient";

const ENTITY_METRICS_TTL_SECONDS = 30;

/**
 * Caches `findByEntityId` — the read every event dashboard request depends
 * on (AnalyticsService.getEventDashboard re-aggregates this same list on
 * every call). A short TTL keeps a live event's dashboard from re-scanning
 * the metrics table on every poll, while `save()` proactively invalidates
 * the affected entity's key so a newly-recorded metric never has to wait
 * out the TTL to show up.
 *
 * Inert (pure passthrough) when constructed with a null cache — same
 * "ships disabled until Redis is configured" pattern as the rate limiter.
 * Cache failures are swallowed, never surfaced to the caller: Postgres is
 * the source of truth, Redis is only ever a speed-up (Constitution: cache
 * is never authoritative).
 */
export class CachedMetricRepository implements MetricRepository {
  constructor(
    private readonly inner: MetricRepository,
    private readonly cache: CacheClient | null,
  ) {}

  async save(metric: Metric): Promise<void> {
    await this.inner.save(metric);
    await this.safeDel(this.entityKey(metric.entityId));
  }

  async findByEntityId(entityId: string): Promise<Metric[]> {
    if (!this.cache) return this.inner.findByEntityId(entityId);

    const key = this.entityKey(entityId);
    const cached = await this.safeGet(key);
    if (cached) {
      try {
        return (JSON.parse(cached) as MetricProps[]).map(
          (props) => new Metric({ ...props, recordedAt: new Date(props.recordedAt) }),
        );
      } catch (err) {
        logger.warn({ err, key }, "Failed to parse cached metrics — falling through to DB");
      }
    }

    const metrics = await this.inner.findByEntityId(entityId);
    await this.safeSet(key, JSON.stringify(metrics));
    return metrics;
  }

  findByType(type: MetricType): Promise<Metric[]> {
    // Not entity-scoped, so it doesn't benefit from the per-entity
    // invalidation above — left uncached rather than caching something
    // that's either wrong (stale across every entity) or short-lived
    // enough to not be worth the complexity.
    return this.inner.findByType(type);
  }

  aggregate(entityId: string, type: MetricType): Promise<{ sum: number; count: number; avg: number }> {
    return this.inner.aggregate(entityId, type);
  }

  private entityKey(entityId: string): string {
    return `analytics:entity:${entityId}`;
  }

  private async safeGet(key: string): Promise<string | null> {
    try {
      return await this.cache!.get(key);
    } catch (err) {
      logger.warn({ err, key }, "Redis GET failed — falling through to DB");
      return null;
    }
  }

  private async safeSet(key: string, value: string): Promise<void> {
    try {
      await this.cache!.set(key, value, "EX", ENTITY_METRICS_TTL_SECONDS);
    } catch (err) {
      logger.warn({ err, key }, "Redis SET failed — continuing without caching this read");
    }
  }

  private async safeDel(key: string): Promise<void> {
    if (!this.cache) return;
    try {
      await this.cache.del(key);
    } catch (err) {
      logger.warn({ err, key }, "Redis DEL failed — cached entry may serve stale data until TTL expiry");
    }
  }
}
