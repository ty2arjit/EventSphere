import { Router } from 'express';
import { PermissionPolicyRepository } from '../../domain/PermissionPolicyRepository';
import { ManagePermissionService } from '../../application/ManagePermissionService';
import { ManageGrantService } from '../../application/ManageGrantService';
import { EvaluatePermissionService } from '../../application/EvaluatePermissionService';
import { AuthorizationController } from '../controllers/AuthorizationController';
import { AuthorizeResourceActionService } from '../../application/AuthorizeResourceActionService';
import { requireAuth } from '../../../authentication/api/middleware/requireAuth';
import {
  validateCreatePermission,
  validateUpdatePermission,
  validateCreateGrant,
  validateEvaluate,
} from '../validators/authorization.validators';

export interface AuthorizationRouterDependencies {
  permissionPolicyRepository: PermissionPolicyRepository;
  authorizeResourceActionService?: AuthorizeResourceActionService;
}

export function createAuthorizationRouter(deps: AuthorizationRouterDependencies): Router {
  const managePermissionService = new ManagePermissionService(deps.permissionPolicyRepository);
  const manageGrantService = new ManageGrantService(deps.permissionPolicyRepository);
  const evaluatePermissionService = new EvaluatePermissionService(deps.permissionPolicyRepository);

  const controller = new AuthorizationController(
    managePermissionService,
    manageGrantService,
    evaluatePermissionService,
    deps.authorizeResourceActionService,
  );

  const router = Router();

  router.get('/permissions', requireAuth, controller.listPermissions);
  router.post('/permissions', requireAuth, validateCreatePermission, controller.createPermission);
  router.put('/permissions/:id', requireAuth, validateUpdatePermission, controller.updatePermission);

  router.get('/grants', requireAuth, controller.listGrants);
  router.post('/grants', requireAuth, validateCreateGrant, controller.createGrant);
  router.delete('/grants/:id', requireAuth, controller.revokeGrant);

  router.post('/evaluate', requireAuth, validateEvaluate, controller.evaluate);
  router.get('/can-manage', requireAuth, controller.canManage);

  return router;
}
