import { Router } from "express";
import type { AnnouncementRepository } from "../../domain/AnnouncementRepository";
import type { EventPublisher } from "../../../../shared/events/EventPublisher";
import { AnnouncementService } from "../../application/AnnouncementService";
import { AnnouncementController } from "../controllers/AnnouncementController";
import { requireAuth } from "../../../authentication/api/middleware/requireAuth";

export interface AnnouncementRouterDependencies {
  announcementRepository: AnnouncementRepository;
  eventPublisher: EventPublisher;
}

export function createAnnouncementRouter(deps: AnnouncementRouterDependencies): Router {
  const controller = new AnnouncementController(
    new AnnouncementService(deps.announcementRepository, deps.eventPublisher),
  );

  const router = Router();

  router.get("/community/:communityId", controller.listByCommunity);
  router.get("/event/:eventId", controller.listByEvent);
  router.get("/:id", controller.getById);
  router.post("/", requireAuth, controller.create);
  router.patch("/:id", requireAuth, controller.update);
  router.post("/:id/publish", requireAuth, controller.publish);
  router.post("/:id/unpublish", requireAuth, controller.unpublish);
  router.delete("/:id", requireAuth, controller.remove);

  return router;
}
