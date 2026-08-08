import type { Prisma, PrismaClient } from "@prisma/client";
import type { MetricRepository } from "../domain/MetricRepository";
import { Metric, type MetricType } from "../domain/Metric";

export class PrismaMetricRepository implements MetricRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(metric: Metric): Promise<void> {
    await this.prisma.metricRecord.create({
      data: {
        id: metric.id,
        type: metric.type,
        entityId: metric.entityId,
        entityType: metric.entityType,
        value: metric.value,
        metadata: metric.metadata as Prisma.InputJsonValue,
        recordedAt: metric.recordedAt,
      },
    });
  }

  async findByEntityId(entityId: string): Promise<Metric[]> {
    const rows = await this.prisma.metricRecord.findMany({
      where: { entityId },
      orderBy: { recordedAt: "desc" },
    });
    return rows.map(
      (r) =>
        new Metric({
          id: r.id,
          type: r.type as MetricType,
          entityId: r.entityId,
          entityType: r.entityType,
          value: r.value,
          metadata: r.metadata as Record<string, unknown>,
          recordedAt: r.recordedAt,
        }),
    );
  }

  async findByType(type: MetricType): Promise<Metric[]> {
    const rows = await this.prisma.metricRecord.findMany({
      where: { type },
      orderBy: { recordedAt: "desc" },
    });
    return rows.map(
      (r) =>
        new Metric({
          id: r.id,
          type: r.type as MetricType,
          entityId: r.entityId,
          entityType: r.entityType,
          value: r.value,
          metadata: r.metadata as Record<string, unknown>,
          recordedAt: r.recordedAt,
        }),
    );
  }

  async aggregate(
    entityId: string,
    type: MetricType,
  ): Promise<{ sum: number; count: number; avg: number }> {
    const result = await this.prisma.metricRecord.aggregate({
      where: { entityId, type },
      _sum: { value: true },
      _count: true,
      _avg: { value: true },
    });
    return {
      sum: result._sum.value ?? 0,
      count: result._count,
      avg: result._avg.value ?? 0,
    };
  }
}
