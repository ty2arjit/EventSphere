import type { Request, Response } from "express";
import type { AnalyticsService } from "../../application/AnalyticsService";
import type { MetricType } from "../../domain/Metric";

export class AnalyticsController {
  constructor(private readonly service: AnalyticsService) {}

  recordMetric = async (req: Request, res: Response): Promise<void> => {
    const { type, entityId, entityType, value, metadata } = req.body;
    const metric = await this.service.recordMetric(type, entityId, entityType, value, metadata);
    res.status(201).json(metric);
  };

  getEntityMetrics = async (req: Request, res: Response): Promise<void> => {
    const entityId = req.params.entityId as string;
    const metrics = await this.service.getEntityMetrics(entityId);
    res.json(metrics);
  };

  getMetricsByType = async (req: Request, res: Response): Promise<void> => {
    const type = req.params.type as MetricType;
    const metrics = await this.service.getMetricsByType(type);
    res.json(metrics);
  };

  getAggregation = async (req: Request, res: Response): Promise<void> => {
    const entityId = req.params.entityId as string;
    const type = req.params.type as MetricType;
    const result = await this.service.getAggregation(entityId, type);
    res.json(result);
  };

  getEventDashboard = async (req: Request, res: Response): Promise<void> => {
    const eventId = req.params.eventId as string;
    const dashboard = await this.service.getEventDashboard(eventId);
    res.json(dashboard);
  };
}
