import { Router } from "express";
import type { EventCommitteeRepository } from "../../domain/EventCommitteeRepository";
import type { EventPublisher } from "../../../../shared/events/EventPublisher";
import { CreateCommitteeService } from "../../application/CreateCommitteeService";
import { GetCommitteeService } from "../../application/GetCommitteeService";
import { TransitionCommitteeService } from "../../application/TransitionCommitteeService";
import { ManageCommitteeRolesService } from "../../application/ManageCommitteeRolesService";
import { CommitteeController } from "../controllers/CommitteeController";
import { requireAuth } from "../../../authentication/api/middleware/requireAuth";
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
}

export function createCommitteeRouter(deps: CommitteeRouterDependencies): Router {
  const controller = new CommitteeController(
    new CreateCommitteeService(deps.committeeRepository, deps.eventPublisher),
    new GetCommitteeService(deps.committeeRepository),
    new TransitionCommitteeService(deps.committeeRepository, deps.eventPublisher),
    new ManageCommitteeRolesService(deps.committeeRepository),
  );

  const router = Router();

  router.get("/event/:eventId", controller.getByEvent);
  router.get("/:id", controller.getById);

  router.post("/", requireAuth, validateCreateCommittee, controller.create);
  router.post("/:id/transition", requireAuth, validateTransition, controller.transition);

  router.post("/:id/roles", requireAuth, validateAddRole, controller.addRole);
  router.patch("/:id/roles/:roleId", requireAuth, validateUpdateRole, controller.updateRole);
  router.put("/:id/roles/:roleId/reporting", requireAuth, validateSetReporting, controller.setReporting);

  router.post("/:id/assignments", requireAuth, validateAssignMember, controller.assignMember);
  router.delete("/:id/assignments/:assignmentId", requireAuth, controller.removeAssignment);

  return router;
}
