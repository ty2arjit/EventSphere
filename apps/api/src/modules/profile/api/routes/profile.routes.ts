import { Router } from 'express';
import { ProfileRepository } from '../../domain/ProfileRepository';
import { RegisterProfileService } from '../../application/RegisterProfileService';
import { GetProfileService } from '../../application/GetProfileService';
import { UpdateProfileService } from '../../application/UpdateProfileService';
import { UpdateAvatarService } from '../../application/UpdateAvatarService';
import { UpdatePreferencesService } from '../../application/UpdatePreferencesService';
import { VerifyIdentityService } from '../../application/VerifyIdentityService';
import { DeactivateProfileService } from '../../application/DeactivateProfileService';
import { ProfileController } from '../controllers/ProfileController';
import { validateRegisterProfile } from '../validators/registerProfile.validator';
import { validateUpdateProfile } from '../validators/updateProfile.validator';
import { validateUpdateAvatar } from '../validators/updateAvatar.validator';
import { validateUpdatePreferences } from '../validators/updatePreferences.validator';
import { EventPublisher } from '../../../../shared/events/EventPublisher';

/**
 * Factory rather than a pre-wired singleton, so the API layer can be tested
 * in isolation with a fake ProfileRepository instead of the real database.
 * app.ts wires this with the real PrismaProfileRepository for production.
 */
export function createProfileRouter(
  profileRepository: ProfileRepository,
  eventPublisher: EventPublisher,
): Router {
  const profileController = new ProfileController(
    new RegisterProfileService(profileRepository, eventPublisher),
    new GetProfileService(profileRepository),
    new UpdateProfileService(profileRepository, eventPublisher),
    new UpdateAvatarService(profileRepository, eventPublisher),
    new UpdatePreferencesService(profileRepository, eventPublisher),
    new VerifyIdentityService(profileRepository, eventPublisher),
    new DeactivateProfileService(profileRepository, eventPublisher),
  );

  const router = Router();
  router.post('/', validateRegisterProfile, profileController.register);
  router.get('/:id', profileController.getById);
  router.patch('/:id', validateUpdateProfile, profileController.updateProfile);
  router.patch('/:id/avatar', validateUpdateAvatar, profileController.updateAvatar);
  router.patch('/:id/preferences', validateUpdatePreferences, profileController.updatePreferences);
  router.post('/:id/verify', profileController.verify);
  router.post('/:id/deactivate', profileController.deactivate);

  return router;
}
