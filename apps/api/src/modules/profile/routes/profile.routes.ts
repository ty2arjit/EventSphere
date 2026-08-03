import { Router } from 'express';
import { ProfileRepository } from '../domain/ProfileRepository';
import { RegisterProfileService } from '../application/RegisterProfileService';
import { ProfileController } from '../controller/ProfileController';
import { validateRegisterProfile } from '../validators/registerProfile.validator';
import { EventPublisher } from '../../../shared/events/EventPublisher';

/**
 * Factory rather than a pre-wired singleton, so the API layer can be tested
 * in isolation with a fake ProfileRepository instead of the real database.
 * app.ts wires this with the real PrismaProfileRepository for production.
 */
export function createProfileRouter(
  profileRepository: ProfileRepository,
  eventPublisher: EventPublisher,
): Router {
  const registerProfileService = new RegisterProfileService(profileRepository, eventPublisher);
  const profileController = new ProfileController(registerProfileService);

  const router = Router();
  router.post('/', validateRegisterProfile, profileController.register);

  return router;
}
