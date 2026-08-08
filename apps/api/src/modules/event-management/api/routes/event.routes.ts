import { Router } from 'express';
import { EventRepository } from '../../domain/EventRepository';
import { EventPublisher } from '../../../../shared/events/EventPublisher';
import { CreateEventService } from '../../application/CreateEventService';
import { GetEventService } from '../../application/GetEventService';
import { UpdateEventService } from '../../application/UpdateEventService';
import { TransitionEventService } from '../../application/TransitionEventService';
import { ManageSessionService } from '../../application/ManageSessionService';
import { EventController } from '../controllers/EventController';
import { requireAuth } from '../../../authentication/api/middleware/requireAuth';
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
}

export function createEventRouter(deps: EventRouterDependencies): Router {
  const controller = new EventController(
    new CreateEventService(deps.eventRepository, deps.eventPublisher),
    new GetEventService(deps.eventRepository),
    new UpdateEventService(deps.eventRepository, deps.eventPublisher),
    new TransitionEventService(deps.eventRepository, deps.eventPublisher),
    new ManageSessionService(deps.eventRepository, deps.eventPublisher),
  );

  const router = Router();

  // Public read
  router.get('/slug/:slug', controller.getBySlug);
  router.get('/community/:communityId', controller.listByCommunity);
  router.get('/:id', controller.getById);

  // Authenticated write
  router.post('/', requireAuth, validateCreateEvent, controller.create);
  router.patch('/:id', requireAuth, validateUpdateEvent, controller.update);
  router.post('/:id/transition', requireAuth, validateTransition, controller.transition);

  // Session management
  router.post('/:id/sessions', requireAuth, validateCreateSession, controller.addSession);
  router.patch('/:id/sessions/:sessionId', requireAuth, validateUpdateSession, controller.updateSession);
  router.post('/:id/sessions/:sessionId/schedule', requireAuth, validateScheduleSession, controller.scheduleSession);
  router.post('/:id/sessions/:sessionId/start', requireAuth, controller.startSession);
  router.post('/:id/sessions/:sessionId/complete', requireAuth, controller.completeSession);
  router.post('/:id/sessions/:sessionId/cancel', requireAuth, controller.cancelSession);

  return router;
}
