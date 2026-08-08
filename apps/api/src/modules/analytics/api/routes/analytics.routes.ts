import { Router } from "express";
import type { MetricRepository } from "../../domain/MetricRepository";
import { AnalyticsService } from "../../application/AnalyticsService";
import { AnalyticsController } from "../controllers/AnalyticsController";
import { requireAuth } from "../../../authentication/api/middleware/requireAuth";

export interface AnalyticsRouterDependencies {
  metricRepository: MetricRepository;
}

export function createAnalyticsRouter(deps: AnalyticsRouterDependencies): Router {
  const router = Router();
  const service = new AnalyticsService(deps.metricRepository);
  const controller = new AnalyticsController(service);

  router.post("/", requireAuth, controller.recordMetric);
  router.get("/entity/:entityId", requireAuth, controller.getEntityMetrics);
  router.get("/type/:type", requireAuth, controller.getMetricsByType);
  router.get("/aggregate/:entityId/:type", requireAuth, controller.getAggregation);
  router.get("/dashboard/event/:eventId", requireAuth, controller.getEventDashboard);

  return router;
}
