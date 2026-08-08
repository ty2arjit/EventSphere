import { Router } from 'express';
import { EventRepository } from '../../domain/EventRepository';
import { EventPublisher } from '../../../../shared/events/EventPublisher';
import { EventNotFoundError } from '../../domain/errors';
import { CreateEventService } from '../../application/CreateEventService';
import { GetEventService } from '../../application/GetEventService';
import { UpdateEventService } from '../../application/UpdateEventService';
import { TransitionEventService } from '../../application/TransitionEventService';
import { ManageSessionService } from '../../application/ManageSessionService';
import { EventController } from '../controllers/EventController';
import { requireAuth } from '../../../authentication/api/middleware/requireAuth';
import { requireResourcePermission } from '../../../authorization/api/middleware/requirePermission';
import { AuthorizeResourceActionService } from '../../../authorization/application/AuthorizeResourceActionService';
import { PERMISSIONS } from '../../../authorization/domain/permissionNames';
import {
  validateCreateEvent,
  validateUpdateEvent,
  validateTransition,
  validateCreateSession,
  validateUpdateSession,
  validateScheduleSession,
} from '../validators/event.validators';

export interface EventRouterDependencies {
  eventRepository: EventRepository;
  eventPublisher: EventPublisher;
  authorizeService: AuthorizeResourceActionService;
}

export function createEventRouter(deps: EventRouterDependencies): Router {
  const controller = new EventController(
    new CreateEventService(deps.eventRepository, deps.eventPublisher),
    new GetEventService(deps.eventRepository),
    new UpdateEventService(deps.eventRepository, deps.eventPublisher),
    new TransitionEventService(deps.eventRepository, deps.eventPublisher),
    new ManageSessionService(deps.eventRepository, deps.eventPublisher),
  );

  const requireEventManage = (idParam = 'id') =>
    requireResourcePermission(deps.authorizeService, PERMISSIONS.EVENT_MANAGE, async (req) => {
      const event = await deps.eventRepository.findById(req.params[idParam] as string);
      if (!event) throw new EventNotFoundError(req.params[idParam] as string);
      return { communityId: event.communityId, eventId: event.id };
    });

  const requireCreateEventManage = requireResourcePermission(
    deps.authorizeService,
    PERMISSIONS.EVENT_MANAGE,
    async (req) => ({ communityId: req.body.communityId as string }),
  );

  const router = Router();

  // Public read
  router.get('/slug/:slug', controller.getBySlug);
  router.get('/community/:communityId', controller.listByCommunity);
  router.get('/:id', controller.getById);

  // Authenticated write — gated on real per-resource permission
  router.post('/', requireAuth, validateCreateEvent, requireCreateEventManage, controller.create);
  router.patch('/:id', requireAuth, validateUpdateEvent, requireEventManage(), controller.update);
  router.post('/:id/transition', requireAuth, validateTransition, requireEventManage(), controller.transition);

  // Session management
  router.post('/:id/sessions', requireAuth, validateCreateSession, requireEventManage(), controller.addSession);
  router.patch('/:id/sessions/:sessionId', requireAuth, validateUpdateSession, requireEventManage(), controller.updateSession);
  router.post('/:id/sessions/:sessionId/schedule', requireAuth, validateScheduleSession, requireEventManage(), controller.scheduleSession);
  router.post('/:id/sessions/:sessionId/start', requireAuth, requireEventManage(), controller.startSession);
  router.post('/:id/sessions/:sessionId/complete', requireAuth, requireEventManage(), controller.completeSession);
  router.post('/:id/sessions/:sessionId/cancel', requireAuth, requireEventManage(), controller.cancelSession);

  return router;
}
