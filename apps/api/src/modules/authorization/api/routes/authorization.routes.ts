import { Router } from 'express';
import { PermissionPolicyRepository } from '../../domain/PermissionPolicyRepository';
import { ManagePermissionService } from '../../application/ManagePermissionService';
import { ManageGrantService } from '../../application/ManageGrantService';
import { EvaluatePermissionService } from '../../application/EvaluatePermissionService';
import { AuthorizationController } from '../controllers/AuthorizationController';
import {
  validateCreatePermission,
  validateUpdatePermission,
  validateCreateGrant,
  validateEvaluate,
} from '../validators/authorization.validators';

export interface AuthorizationRouterDependencies {
  permissionPolicyRepository: PermissionPolicyRepository;
}

export function createAuthorizationRouter(deps: AuthorizationRouterDependencies): Router {
  const managePermissionService = new ManagePermissionService(deps.permissionPolicyRepository);
  const manageGrantService = new ManageGrantService(deps.permissionPolicyRepository);
  const evaluatePermissionService = new EvaluatePermissionService(deps.permissionPolicyRepository);

  const controller = new AuthorizationController(
    managePermissionService,
    manageGrantService,
    evaluatePermissionService,
  );

  const router = Router();

  router.get('/permissions', controller.listPermissions);
  router.post('/permissions', validateCreatePermission, controller.createPermission);
  router.put('/permissions/:id', validateUpdatePermission, controller.updatePermission);

  router.get('/grants', controller.listGrants);
  router.post('/grants', validateCreateGrant, controller.createGrant);
  router.delete('/grants/:id', controller.revokeGrant);

  router.post('/evaluate', validateEvaluate, controller.evaluate);

  return router;
}
