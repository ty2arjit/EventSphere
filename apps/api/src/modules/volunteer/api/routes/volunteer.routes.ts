import { Router } from "express";
import type { OperationalTaskRepository } from "../../domain/OperationalTaskRepository";
import type { EventPublisher } from "../../../../shared/events/EventPublisher";
import { ManageTaskService } from "../../application/ManageTaskService";
import { VolunteerController } from "../controllers/VolunteerController";
import { requireAuth } from "../../../authentication/api/middleware/requireAuth";

export interface VolunteerRouterDependencies {
  taskRepository: OperationalTaskRepository;
  eventPublisher: EventPublisher;
}

export function createVolunteerRouter(deps: VolunteerRouterDependencies): Router {
  const controller = new VolunteerController(
    new ManageTaskService(deps.taskRepository, deps.eventPublisher),
  );

  const router = Router();

  router.get("/event/:eventId", controller.listByEvent);
  router.get("/:id", controller.getById);
  router.post("/", requireAuth, controller.create);
  router.patch("/:id", requireAuth, controller.update);
  router.post("/:id/transition", requireAuth, controller.transition);
  router.post("/:id/assign", requireAuth, controller.assign);
  router.post("/:id/unassign", requireAuth, controller.unassign);
  router.post("/:id/checklist", requireAuth, controller.addChecklistItem);
  router.post("/:id/checklist/:itemId/toggle", requireAuth, controller.toggleChecklistItem);

  return router;
}
