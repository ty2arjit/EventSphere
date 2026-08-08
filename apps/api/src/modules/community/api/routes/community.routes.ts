import { Router } from 'express';
import { CommunityRepository } from '../../domain/CommunityRepository';
import { EventPublisher } from '../../../../shared/events/EventPublisher';
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

  const router = Router();

  // Public read endpoints
  router.get('/slug/:slug', controller.getBySlug);
  router.get('/:id', controller.getById);

  // Authenticated endpoints
  router.get('/', requireAuth, controller.listMyCommunities);
  router.post('/', requireAuth, validateCreateCommunity, controller.create);
  router.patch('/:id', requireAuth, validateUpdateCommunity, controller.update);
  router.post('/:id/join', requireAuth, controller.join);
  router.post('/:id/leave', requireAuth, controller.leave);
  router.post('/:id/positions', requireAuth, validateCreatePosition, controller.createPosition);
  router.patch('/:id/positions/:positionId', requireAuth, validateUpdatePosition, controller.updatePosition);
  router.post('/:id/positions/:positionId/assign/:memberId', requireAuth, controller.assignPosition);
  router.delete('/:id/positions/:positionId/assign/:memberId', requireAuth, controller.removePositionAssignment);
  router.post('/:id/invitations', requireAuth, validateCreateInvitation, controller.createInvitation);
  router.post('/:id/invitations/:invitationId/accept', requireAuth, controller.acceptInvitation);
  router.post('/:id/transfer-ownership', requireAuth, controller.transferOwnership);
  router.patch('/:id/settings', requireAuth, validateUpdateSettings, controller.updateSettings);

  return router;
}
