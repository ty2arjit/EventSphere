import type { MetricRepository } from "../domain/MetricRepository";
import { Metric, type MetricType } from "../domain/Metric";

export class AnalyticsService {
  constructor(private readonly repo: MetricRepository) {}

  async recordMetric(
    type: MetricType,
    entityId: string,
    entityType: string,
    value: number,
    metadata: Record<string, unknown> = {},
  ): Promise<Metric> {
    const metric = Metric.record(type, entityId, entityType, value, metadata);
    await this.repo.save(metric);
    return metric;
  }

  async getEntityMetrics(entityId: string): Promise<Metric[]> {
    return this.repo.findByEntityId(entityId);
  }

  async getMetricsByType(type: MetricType): Promise<Metric[]> {
    return this.repo.findByType(type);
  }

  async getAggregation(entityId: string, type: MetricType) {
    return this.repo.aggregate(entityId, type);
  }

  async getEventDashboard(eventId: string) {
    const metrics = await this.repo.findByEntityId(eventId);
    const enrollments = metrics.filter((m) => m.type === "EnrollmentCount");
    const attendance = metrics.filter((m) => m.type === "AttendanceRate");
    const certificates = metrics.filter((m) => m.type === "CertificateIssued");
    const tasks = metrics.filter((m) => m.type === "TaskCompletion");

    return {
      totalEnrollments: enrollments.reduce((sum, m) => sum + m.value, 0),
      averageAttendance: attendance.length > 0
        ? attendance.reduce((sum, m) => sum + m.value, 0) / attendance.length
        : 0,
      certificatesIssued: certificates.reduce((sum, m) => sum + m.value, 0),
      taskCompletionRate: tasks.length > 0
        ? tasks.reduce((sum, m) => sum + m.value, 0) / tasks.length
        : 0,
      metricCount: metrics.length,
    };
  }
}
