import { Router } from "express";
import type { AnnouncementRepository } from "../../domain/AnnouncementRepository";
import type { EventRepository } from "../../../event-management/domain/EventRepository";
import type { EventPublisher } from "../../../../shared/events/EventPublisher";
import { AnnouncementNotFoundError } from "../../domain/errors";
import { AnnouncementService } from "../../application/AnnouncementService";
import { AnnouncementController } from "../controllers/AnnouncementController";
import { requireAuth } from "../../../authentication/api/middleware/requireAuth";
import { requireResourcePermission, type ResolvedResourceContext } from "../../../authorization/api/middleware/requirePermission";
import { AuthorizeResourceActionService } from "../../../authorization/application/AuthorizeResourceActionService";
import { resolveEventCommunityId } from "../../../authorization/application/resolveEventContext";
import { PERMISSIONS } from "../../../authorization/domain/permissionNames";

export interface AnnouncementRouterDependencies {
  announcementRepository: AnnouncementRepository;
  eventRepository: EventRepository;
  eventPublisher: EventPublisher;
  authorizeService: AuthorizeResourceActionService;
}

export function createAnnouncementRouter(deps: AnnouncementRouterDependencies): Router {
  const controller = new AnnouncementController(
    new AnnouncementService(deps.announcementRepository, deps.eventPublisher),
  );

  async function resolveScope(communityId: string | null, eventId: string | null): Promise<ResolvedResourceContext> {
    if (communityId) return { communityId, eventId };
    if (eventId) return { communityId: await resolveEventCommunityId(deps.eventRepository, eventId), eventId };
    throw new Error("Announcement must be scoped to a communityId or eventId");
  }

  const requireCreateAnnouncementManage = requireResourcePermission(
    deps.authorizeService,
    PERMISSIONS.ANNOUNCEMENT_MANAGE,
    async (req) => resolveScope(req.body.communityId ?? null, req.body.eventId ?? null),
  );

  const requireAnnouncementManage = requireResourcePermission(
    deps.authorizeService,
    PERMISSIONS.ANNOUNCEMENT_MANAGE,
    async (req) => {
      const a = await deps.announcementRepository.findById(req.params.id as string);
      if (!a) throw new AnnouncementNotFoundError(req.params.id as string);
      return resolveScope(a.communityId, a.eventId);
    },
  );

  const router = Router();

  router.get("/community/:communityId", controller.listByCommunity);
  router.get("/event/:eventId", controller.listByEvent);
  router.get("/:id", controller.getById);
  router.post("/", requireAuth, requireCreateAnnouncementManage, controller.create);
  router.patch("/:id", requireAuth, requireAnnouncementManage, controller.update);
  router.post("/:id/publish", requireAuth, requireAnnouncementManage, controller.publish);
  router.post("/:id/unpublish", requireAuth, requireAnnouncementManage, controller.unpublish);
  router.delete("/:id", requireAuth, requireAnnouncementManage, controller.remove);

  return router;
}
