import { Router } from "express";
import type { OperationalTaskRepository } from "../../domain/OperationalTaskRepository";
import type { EventRepository } from "../../../event-management/domain/EventRepository";
import type { EventPublisher } from "../../../../shared/events/EventPublisher";
import { TaskNotFoundError } from "../../domain/errors";
import { ManageTaskService } from "../../application/ManageTaskService";
import { VolunteerController } from "../controllers/VolunteerController";
import { requireAuth } from "../../../authentication/api/middleware/requireAuth";
import { requireResourcePermission } from "../../../authorization/api/middleware/requirePermission";
import { AuthorizeResourceActionService } from "../../../authorization/application/AuthorizeResourceActionService";
import { resolveEventCommunityId } from "../../../authorization/application/resolveEventContext";
import { PERMISSIONS } from "../../../authorization/domain/permissionNames";

export interface VolunteerRouterDependencies {
  taskRepository: OperationalTaskRepository;
  eventRepository: EventRepository;
  eventPublisher: EventPublisher;
  authorizeService: AuthorizeResourceActionService;
}

export function createVolunteerRouter(deps: VolunteerRouterDependencies): Router {
  const controller = new VolunteerController(
    new ManageTaskService(deps.taskRepository, deps.eventPublisher),
  );

  const requireCreateTaskManage = requireResourcePermission(
    deps.authorizeService,
    PERMISSIONS.TASK_MANAGE,
    async (req) => {
      const eventId = req.body.eventId as string;
      return { communityId: await resolveEventCommunityId(deps.eventRepository, eventId), eventId };
    },
  );

  const requireTaskManage = requireResourcePermission(
    deps.authorizeService,
    PERMISSIONS.TASK_MANAGE,
    async (req) => {
      const task = await deps.taskRepository.findById(req.params.id as string);
      if (!task) throw new TaskNotFoundError(req.params.id as string);
      return { communityId: await resolveEventCommunityId(deps.eventRepository, task.eventId), eventId: task.eventId };
    },
  );

  const router = Router();

  router.get("/event/:eventId", controller.listByEvent);
  router.get("/:id", controller.getById);
  router.post("/", requireAuth, requireCreateTaskManage, controller.create);
  router.patch("/:id", requireAuth, requireTaskManage, controller.update);
  router.post("/:id/transition", requireAuth, requireTaskManage, controller.transition);
  router.post("/:id/assign", requireAuth, requireTaskManage, controller.assign);
  router.post("/:id/unassign", requireAuth, requireTaskManage, controller.unassign);
  router.post("/:id/checklist", requireAuth, requireTaskManage, controller.addChecklistItem);
  router.post("/:id/checklist/:itemId/toggle", requireAuth, requireTaskManage, controller.toggleChecklistItem);

  return router;
}
