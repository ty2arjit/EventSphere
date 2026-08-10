import { Router, Request } from 'express';
import { CommunityRepository } from '../../domain/CommunityRepository';
import { EventPublisher } from '../../../../shared/events/EventPublisher';
import { AuthorizeResourceActionService } from '../../../authorization/application/AuthorizeResourceActionService';
import { requireResourcePermission } from '../../../authorization/api/middleware/requirePermission';
import { PERMISSIONS } from '../../../authorization/domain/permissionNames';
import { AccessDeniedError } from '../../../authorization/domain/errors';
import { CommunityNotFoundError } from '../../domain/errors';
import { CreateCommunityService } from '../../application/CreateCommunityService';
import { GetCommunityService } from '../../application/GetCommunityService';
import { UpdateCommunityService } from '../../application/UpdateCommunityService';
import { JoinCommunityService } from '../../application/JoinCommunityService';
import { LeaveCommunityService } from '../../application/LeaveCommunityService';
import { ManagePositionService } from '../../application/ManagePositionService';
import { InvitationService } from '../../application/InvitationService';
import { TransferOwnershipService } from '../../application/TransferOwnershipService';
import { UpdateCommunitySettingsService } from '../../application/UpdateCommunitySettingsService';
import { CommunityController } from '../controllers/CommunityController';
import { requireAuth } from '../../../authentication/api/middleware/requireAuth';
import {
  validateCreateCommunity,
  validateUpdateCommunity,
  validateCreatePosition,
  validateUpdatePosition,
  validateCreateInvitation,
  validateUpdateSettings,
} from '../validators/community.validators';

export interface CommunityRouterDependencies {
  communityRepository: CommunityRepository;
  eventPublisher: EventPublisher;
  authorizeResourceActionService?: AuthorizeResourceActionService;
}

export function createCommunityRouter(deps: CommunityRouterDependencies): Router {
  const controller = new CommunityController(
    new CreateCommunityService(deps.communityRepository, deps.eventPublisher),
    new GetCommunityService(deps.communityRepository),
    new UpdateCommunityService(deps.communityRepository, deps.eventPublisher),
    new JoinCommunityService(deps.communityRepository, deps.eventPublisher),
    new LeaveCommunityService(deps.communityRepository, deps.eventPublisher),
    new ManagePositionService(deps.communityRepository, deps.eventPublisher),
    new InvitationService(deps.communityRepository, deps.eventPublisher),
    new TransferOwnershipService(deps.communityRepository, deps.eventPublisher),
    new UpdateCommunitySettingsService(deps.communityRepository),
  );

  // Every mutating route below used to carry only requireAuth — any
  // logged-in user could rename another community, create/assign
  // positions in it, invite people to it, or even transfer its ownership
  // to themselves. requireManage gates on community:manage (the owner
  // fast path in AuthorizeResourceActionService covers the normal case
  // for free; delegation is possible later via a Grant, same as every
  // other bounded context). Ownership transfer gets its own, stricter
  // check — that's not something an owner should be able to delegate
  // away, so it's owner-only rather than grant-eligible.
  const requireManage = deps.authorizeResourceActionService
    ? requireResourcePermission(
        deps.authorizeResourceActionService,
        PERMISSIONS.COMMUNITY_MANAGE,
        async (req: Request) => ({ communityId: req.params.id as string }),
      )
    : (_req: Request, _res: unknown, next: (err?: unknown) => void) => next(new AccessDeniedError());

  const requireOwner = async (req: Request, _res: unknown, next: (err?: unknown) => void) => {
    try {
      const community = await deps.communityRepository.findById(req.params.id as string);
      if (!community) throw new CommunityNotFoundError(req.params.id as string);
      if (community.ownerId !== req.user!.id) throw new AccessDeniedError();
      next();
    } catch (err) {
      next(err);
    }
  };

  const router = Router();

  // Public read endpoints
  router.get('/browse', controller.browse);
  router.get('/slug/:slug', controller.getBySlug);
  router.get('/:id', controller.getById);

  // Authenticated endpoints
  router.get('/', requireAuth, controller.listMyCommunities);
  router.post('/', requireAuth, validateCreateCommunity, controller.create);
  router.patch('/:id', requireAuth, validateUpdateCommunity, requireManage, controller.update);
  router.post('/:id/join', requireAuth, controller.join);
  router.post('/:id/leave', requireAuth, controller.leave);
  router.post('/:id/positions', requireAuth, validateCreatePosition, requireManage, controller.createPosition);
  router.patch('/:id/positions/:positionId', requireAuth, validateUpdatePosition, requireManage, controller.updatePosition);
  router.post('/:id/positions/:positionId/assign/:memberId', requireAuth, requireManage, controller.assignPosition);
  router.delete('/:id/positions/:positionId/assign/:memberId', requireAuth, requireManage, controller.removePositionAssignment);
  router.post('/:id/invitations', requireAuth, validateCreateInvitation, requireManage, controller.createInvitation);
  router.post('/:id/invitations/:invitationId/accept', requireAuth, controller.acceptInvitation);
  router.post('/:id/transfer-ownership', requireAuth, requireOwner, controller.transferOwnership);
  router.patch('/:id/settings', requireAuth, validateUpdateSettings, requireManage, controller.updateSettings);

  return router;
}
