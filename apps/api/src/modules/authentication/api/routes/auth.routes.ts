import { Router } from 'express';
import { UserCredentialRepository } from '../../domain/UserCredentialRepository';
import { PasswordHasher } from '../../domain/services/PasswordHasher';
import { TokenHasher } from '../../domain/services/TokenHasher';
import { RandomTokenGenerator } from '../../domain/services/RandomTokenGenerator';
import { JwtService } from '../../infrastructure/JoseJwtService';
import { Mailer } from '../../infrastructure/Mailer';
import { EventPublisher } from '../../../../shared/events/EventPublisher';
import { AuthConfig } from '../../application/AuthConfig';
import { ProfileGateway } from '../../application/ProfileGateway';
import { RegisterCredentialService } from '../../application/RegisterCredentialService';
import { AuthenticateWithPasswordService } from '../../application/AuthenticateWithPasswordService';
import { RefreshSessionService } from '../../application/RefreshSessionService';
import { LogoutService } from '../../application/LogoutService';
import { LogoutEverywhereService } from '../../application/LogoutEverywhereService';
import { RequestEmailVerificationService } from '../../application/RequestEmailVerificationService';
import { ConfirmEmailVerificationService } from '../../application/ConfirmEmailVerificationService';
import { RequestPasswordResetService } from '../../application/RequestPasswordResetService';
import { CompletePasswordResetService } from '../../application/CompletePasswordResetService';
import { ChangePasswordService } from '../../application/ChangePasswordService';
import { AuthController } from '../controllers/AuthController';
import { requireAuth } from '../middleware/requireAuth';
import { authRateLimit, verificationRateLimit } from '../middleware/rateLimit';
import { validateRegister } from '../validators/register.validator';
import { validateLogin } from '../validators/login.validator';
import { validateRequestPasswordReset } from '../validators/requestPasswordReset.validator';
import { validateCompletePasswordReset } from '../validators/completePasswordReset.validator';
import { validateConfirmEmailVerification } from '../validators/confirmEmailVerification.validator';
import { validateChangePassword } from '../validators/changePassword.validator';

export interface AuthRouterDependencies {
  credentialRepository: UserCredentialRepository;
  passwordHasher: PasswordHasher;
  tokenHasher: TokenHasher;
  tokenGenerator: RandomTokenGenerator;
  jwtService: JwtService;
  mailer: Mailer;
  eventPublisher: EventPublisher;
  authConfig: AuthConfig;
  profileGateway: ProfileGateway;
}

export function createAuthRouter(deps: AuthRouterDependencies): Router {
  const controller = new AuthController(
    new RegisterCredentialService(
      deps.credentialRepository,
      deps.profileGateway,
      deps.passwordHasher,
      deps.tokenHasher,
      deps.tokenGenerator,
      deps.eventPublisher,
      deps.mailer,
      deps.authConfig,
    ),
    new AuthenticateWithPasswordService(
      deps.credentialRepository,
      deps.passwordHasher,
      deps.tokenHasher,
      deps.tokenGenerator,
      deps.jwtService,
      deps.eventPublisher,
      deps.authConfig,
    ),
    new RefreshSessionService(
      deps.credentialRepository,
      deps.tokenHasher,
      deps.tokenGenerator,
      deps.jwtService,
      deps.eventPublisher,
      deps.authConfig,
    ),
    new LogoutService(deps.credentialRepository, deps.eventPublisher),
    new LogoutEverywhereService(deps.credentialRepository, deps.eventPublisher),
    new RequestEmailVerificationService(
      deps.credentialRepository,
      deps.tokenHasher,
      deps.tokenGenerator,
      deps.mailer,
      deps.authConfig,
    ),
    new ConfirmEmailVerificationService(deps.credentialRepository, deps.tokenHasher, deps.eventPublisher),
    new RequestPasswordResetService(
      deps.credentialRepository,
      deps.tokenHasher,
      deps.tokenGenerator,
      deps.mailer,
      deps.authConfig,
    ),
    new CompletePasswordResetService(
      deps.credentialRepository,
      deps.passwordHasher,
      deps.tokenHasher,
      deps.eventPublisher,
    ),
    new ChangePasswordService(deps.credentialRepository, deps.passwordHasher, deps.eventPublisher),
    deps.credentialRepository,
    deps.authConfig,
  );

  const router = Router();

  // Public endpoints — rate-limited
  router.post('/register', authRateLimit, validateRegister, controller.register);
  router.post('/login', authRateLimit, validateLogin, controller.login);
  router.post('/refresh', controller.refresh);
  router.post('/email/verify', verificationRateLimit, validateConfirmEmailVerification, controller.confirmEmailVerification);
  router.post('/password/request-reset', verificationRateLimit, validateRequestPasswordReset, controller.requestPasswordReset);
  router.post('/password/reset', verificationRateLimit, validateCompletePasswordReset, controller.completePasswordReset);

  // Authenticated endpoints
  router.post('/logout', controller.logout);
  router.post('/logout-everywhere', requireAuth, controller.logoutEverywhere);
  router.post('/email/request-verification', requireAuth, verificationRateLimit, controller.requestEmailVerification);
  router.post('/password/change', requireAuth, validateChangePassword, controller.changePassword);
  router.get('/me', requireAuth, controller.me);

  return router;
}
