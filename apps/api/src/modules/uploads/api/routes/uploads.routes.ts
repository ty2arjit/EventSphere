import { Router } from "express";
import { CloudinarySignatureService } from "../../infrastructure/CloudinarySignatureService";
import { UploadsController } from "../controllers/UploadsController";
import { requireAuth } from "../../../authentication/api/middleware/requireAuth";

export interface UploadsRouterDependencies {
  signatureService: CloudinarySignatureService | null;
}

/**
 * Any logged-in user can request a signature — this only proves "you're a
 * real app user", not "you're allowed to set this on resource X". Actual
 * authorization (only your own avatar, only a community you manage, only
 * an event you manage) is enforced separately by the existing requireSelf/
 * requireManage checks on the PATCH endpoints that save the resulting URL.
 */
export function createUploadsRouter(deps: UploadsRouterDependencies): Router {
  const controller = new UploadsController(deps.signatureService);
  const router = Router();
  router.get("/signature", requireAuth, controller.getSignature);
  return router;
}
