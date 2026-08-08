import type { Metric, MetricType } from "./Metric";

export interface MetricRepository {
  save(metric: Metric): Promise<void>;
  findByEntityId(entityId: string): Promise<Metric[]>;
  findByType(type: MetricType): Promise<Metric[]>;
  aggregate(entityId: string, type: MetricType): Promise<{ sum: number; count: number; avg: number }>;
}
