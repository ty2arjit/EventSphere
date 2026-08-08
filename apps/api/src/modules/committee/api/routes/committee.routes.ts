import { Router } from "express";
import type { EventCommitteeRepository } from "../../domain/EventCommitteeRepository";
import type { EventPublisher } from "../../../../shared/events/EventPublisher";
import { CommitteeNotFoundError } from "../../domain/errors";
import { CreateCommitteeService } from "../../application/CreateCommitteeService";
import { GetCommitteeService } from "../../application/GetCommitteeService";
import { TransitionCommitteeService } from "../../application/TransitionCommitteeService";
import { ManageCommitteeRolesService } from "../../application/ManageCommitteeRolesService";
import { CommitteeController } from "../controllers/CommitteeController";
import { requireAuth } from "../../../authentication/api/middleware/requireAuth";
import { requireResourcePermission } from "../../../authorization/api/middleware/requirePermission";
import { AuthorizeResourceActionService } from "../../../authorization/application/AuthorizeResourceActionService";
import { PERMISSIONS } from "../../../authorization/domain/permissionNames";
import {
  validateCreateCommittee,
  validateAddRole,
  validateUpdateRole,
  validateSetReporting,
  validateAssignMember,
  validateTransition,
} from "../validators/committee.validators";

export interface CommitteeRouterDependencies {
  committeeRepository: EventCommitteeRepository;
  eventPublisher: EventPublisher;
  authorizeService: AuthorizeResourceActionService;
}

export function createCommitteeRouter(deps: CommitteeRouterDependencies): Router {
  const controller = new CommitteeController(
    new CreateCommitteeService(deps.committeeRepository, deps.eventPublisher),
    new GetCommitteeService(deps.committeeRepository),
    new TransitionCommitteeService(deps.committeeRepository, deps.eventPublisher),
    new ManageCommitteeRolesService(deps.committeeRepository),
  );

  const requireCommitteeManage = requireResourcePermission(
    deps.authorizeService,
    PERMISSIONS.COMMITTEE_MANAGE,
    async (req) => {
      const committee = await deps.committeeRepository.findById(req.params.id as string);
      if (!committee) throw new CommitteeNotFoundError(req.params.id as string);
      return { communityId: committee.communityId, eventId: committee.eventId };
    },
  );

  const requireCreateCommitteeManage = requireResourcePermission(
    deps.authorizeService,
    PERMISSIONS.COMMITTEE_MANAGE,
    async (req) => ({ communityId: req.body.communityId as string, eventId: req.body.eventId as string }),
  );

  const router = Router();

  router.get("/event/:eventId", controller.getByEvent);
  router.get("/:id", controller.getById);

  router.post("/", requireAuth, validateCreateCommittee, requireCreateCommitteeManage, controller.create);
  router.post("/:id/transition", requireAuth, validateTransition, requireCommitteeManage, controller.transition);

  router.post("/:id/roles", requireAuth, validateAddRole, requireCommitteeManage, controller.addRole);
  router.patch("/:id/roles/:roleId", requireAuth, validateUpdateRole, requireCommitteeManage, controller.updateRole);
  router.put("/:id/roles/:roleId/reporting", requireAuth, validateSetReporting, requireCommitteeManage, controller.setReporting);

  router.post("/:id/assignments", requireAuth, validateAssignMember, requireCommitteeManage, controller.assignMember);
  router.delete("/:id/assignments/:assignmentId", requireAuth, requireCommitteeManage, controller.removeAssignment);

  return router;
}
