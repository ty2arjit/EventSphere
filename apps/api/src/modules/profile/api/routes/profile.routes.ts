import { Router, Request, Response, NextFunction } from 'express';
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
import { requireAuth } from '../../../authentication/api/middleware/requireAuth';
import { AccessDeniedError } from '../../../authorization/domain/errors';

/**
 * A user can only ever act on their own profile — there's no delegation
 * concept here (unlike Community/Event, nothing else can legitimately
 * manage someone else's identity/avatar/preferences on their behalf).
 * Must be chained after requireAuth.
 */
function requireSelf(req: Request, _res: Response, next: NextFunction): void {
  if (req.user!.id !== req.params.id) {
    next(new AccessDeniedError());
    return;
  }
  next();
}

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
  // Registration is necessarily pre-auth; GET is a public profile view,
  // consistent with every other bounded context's read endpoints.
  router.post('/', validateRegisterProfile, profileController.register);
  router.get('/:id', profileController.getById);

  // Every mutating route below used to have NO auth at all — anyone,
  // logged in or not, could PATCH any user's bio/avatar/preferences or
  // deactivate any account just by knowing their profile id.
  router.patch('/:id', requireAuth, requireSelf, validateUpdateProfile, profileController.updateProfile);
  router.patch('/:id/avatar', requireAuth, requireSelf, validateUpdateAvatar, profileController.updateAvatar);
  router.patch('/:id/preferences', requireAuth, requireSelf, validateUpdatePreferences, profileController.updatePreferences);
  router.post('/:id/verify', requireAuth, requireSelf, profileController.verify);
  router.post('/:id/deactivate', requireAuth, requireSelf, profileController.deactivate);

  return router;
}
