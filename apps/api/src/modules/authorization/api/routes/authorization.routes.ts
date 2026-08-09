import { Router, Request } from 'express';
import { PermissionPolicyRepository } from '../../domain/PermissionPolicyRepository';
import { EventRepository } from '../../../event-management/domain/EventRepository';
import { ManagePermissionService } from '../../application/ManagePermissionService';
import { ManageGrantService } from '../../application/ManageGrantService';
import { EvaluatePermissionService } from '../../application/EvaluatePermissionService';
import { AuthorizationController } from '../controllers/AuthorizationController';
import { AuthorizeResourceActionService } from '../../application/AuthorizeResourceActionService';
import { requireAuth } from '../../../authentication/api/middleware/requireAuth';
import { requireResourcePermission, ResourceContextResolver } from '../middleware/requirePermission';
import { PERMISSIONS } from '../../domain/permissionNames';
import { AccessDeniedError, GrantNotFoundError } from '../../domain/errors';
import { resolveEventCommunityId } from '../../application/resolveEventContext';
import {
  validateCreatePermission,
  validateUpdatePermission,
  validateCreateGrant,
  validateEvaluate,
} from '../validators/authorization.validators';

export interface AuthorizationRouterDependencies {
  permissionPolicyRepository: PermissionPolicyRepository;
  eventRepository: EventRepository;
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

  // A grant is what decides who can manage what — creating or revoking one
  // is itself a privileged action. Without this, requireAuth alone would
  // let any logged-in user grant themselves any permission in any
  // community. Community/Event-scoped grants require authorization:manage
  // in that scope (the community-owner fast path in
  // AuthorizeResourceActionService covers the common case for free);
  // Platform-scoped grants have no bootstrap mechanism at all yet (no
  // PlatformAdmin assignment table exists), so they're rejected outright
  // rather than left silently open to whoever asks first.
  const resolveGrantMutationContext = (
    getContext: (req: Request) => Promise<{ contextLevel: string; contextId: string | null }>,
  ): ResourceContextResolver => {
    return async (req: Request) => {
      const { contextLevel, contextId } = await getContext(req);
      if (contextLevel === 'Platform' || !contextId) {
        throw new AccessDeniedError();
      }
      if (contextLevel === 'Event') {
        return { communityId: await resolveEventCommunityId(deps.eventRepository, contextId), eventId: contextId };
      }
      return { communityId: contextId, eventId: null };
    };
  };

  const requireGrantCreateAccess = deps.authorizeResourceActionService
    ? requireResourcePermission(
        deps.authorizeResourceActionService,
        PERMISSIONS.AUTHORIZATION_MANAGE,
        resolveGrantMutationContext(async (req) => ({
          contextLevel: req.body.contextLevel,
          contextId: req.body.contextId ?? null,
        })),
      )
    : (_req: Request, _res: unknown, next: (err?: unknown) => void) => next(new AccessDeniedError());

  const requireGrantRevokeAccess = deps.authorizeResourceActionService
    ? requireResourcePermission(
        deps.authorizeResourceActionService,
        PERMISSIONS.AUTHORIZATION_MANAGE,
        resolveGrantMutationContext(async (req) => {
          const policy = await deps.permissionPolicyRepository.load();
          const grant = policy.grants.find((g) => g.id === req.params.id);
          if (!grant) throw new GrantNotFoundError(req.params.id as string);
          return { contextLevel: grant.contextLevel, contextId: grant.contextId };
        }),
      )
    : (_req: Request, _res: unknown, next: (err?: unknown) => void) => next(new AccessDeniedError());

  const router = Router();

  router.get('/permissions', requireAuth, controller.listPermissions);
  router.post('/permissions', requireAuth, validateCreatePermission, controller.createPermission);
  router.put('/permissions/:id', requireAuth, validateUpdatePermission, controller.updatePermission);

  router.get('/grants', requireAuth, controller.listGrants);
  router.post('/grants', requireAuth, validateCreateGrant, requireGrantCreateAccess, controller.createGrant);
  router.delete('/grants/:id', requireAuth, requireGrantRevokeAccess, controller.revokeGrant);

  router.post('/evaluate', requireAuth, validateEvaluate, controller.evaluate);
  router.get('/can-manage', requireAuth, controller.canManage);

  return router;
}
