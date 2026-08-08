import { Router } from "express";
import type { MetricRepository } from "../../../analytics/domain/MetricRepository";
import { AnalyticsService } from "../../../analytics/application/AnalyticsService";
import { AIAssistantService } from "../../application/AIAssistantService";
import { RecommendationController } from "../controllers/RecommendationController";
import { requireAuth } from "../../../authentication/api/middleware/requireAuth";

export interface RecommendationRouterDependencies {
  metricRepository: MetricRepository;
}

export function createRecommendationRouter(deps: RecommendationRouterDependencies): Router {
  const router = Router();
  const analyticsService = new AnalyticsService(deps.metricRepository);
  const aiService = new AIAssistantService(analyticsService);
  const controller = new RecommendationController(aiService);

  router.post("/insight", requireAuth, controller.getInsight);
  router.get("/event/:eventId/summary", requireAuth, controller.getEventSummary);
  router.get("/event/:eventId/registration", requireAuth, controller.getRegistrationInsight);
  router.get("/event/:eventId/attendance", requireAuth, controller.getAttendanceInsight);
  router.get("/event/:eventId/tasks", requireAuth, controller.getTaskSuggestions);

  return router;
}
