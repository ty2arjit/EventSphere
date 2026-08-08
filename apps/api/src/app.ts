import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import pinoHttp from 'pino-http';
import { ProfileRepository } from './modules/profile/domain/ProfileRepository';
import { createProfileRouter } from './modules/profile/api/routes/profile.routes';
import { createAuthRouter, AuthRouterDependencies } from './modules/authentication/api/routes/auth.routes';
import { createAuthenticateMiddleware } from './modules/authentication/api/middleware/authenticate';
import { JwtService } from './modules/authentication/infrastructure/JoseJwtService';
import { createCommunityRouter, CommunityRouterDependencies } from './modules/community/api/routes/community.routes';
import { createAuthorizationRouter, AuthorizationRouterDependencies } from './modules/authorization/api/routes/authorization.routes';
import { EventPublisher } from './shared/events/EventPublisher';
import { errorHandler } from './shared/errors/errorHandler';
import { httpLoggerOptions, logger } from './shared/logger';

export interface AppDependencies {
  profileRepository: ProfileRepository;
  eventPublisher: EventPublisher;
  corsOrigins: string[];
  checkDatabase?: () => Promise<void>;
  jwtService?: JwtService;
  authDependencies?: AuthRouterDependencies;
  communityDependencies?: CommunityRouterDependencies;
  authorizationDependencies?: AuthorizationRouterDependencies;
}

/**
 * Accepts its dependencies rather than importing the real Prisma repository
 * directly, so tests can build the app with fakes instead of hitting a real
 * database or publishing real events.
 */
export function createApp({
  profileRepository,
  eventPublisher,
  corsOrigins,
  checkDatabase,
  jwtService,
  authDependencies,
  communityDependencies,
  authorizationDependencies,
}: AppDependencies): Express {
  const app = express();

  // Suppresses the `x-powered-by: Express` response header. Volunteering the
  // server technology only helps someone matching known Express CVEs.
  app.disable('x-powered-by');

  // Baseline security headers (HSTS, nosniff, frame-ancestors, etc.). Placed
  // first so headers apply to every response, including errors.
  app.use(helmet());

  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(cookieParser());
  app.use(express.json());

  if (jwtService) {
    app.use(createAuthenticateMiddleware(jwtService));
  }

  // Uses custom serializers that omit credential-bearing headers — see
  // shared/logger for the allowlist rationale.
  app.use(pinoHttp(httpLoggerOptions));

  /**
   * LIVENESS — is the process up and serving?
   *
   * Deliberately checks nothing external. A liveness probe that fails on a
   * database outage would cause the platform to kill and restart a perfectly
   * healthy process, turning a recoverable dependency blip into a crash loop.
   */
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  /**
   * READINESS — can this instance actually serve requests?
   *
   * Verifies the database is reachable, so an instance that started but cannot
   * reach Neon is reported unhealthy instead of silently accepting traffic and
   * returning 500s. This is the endpoint a load balancer should gate on.
   *
   * Returns 503 (not 500) on failure: the condition is expected and transient,
   * and 503 is what orchestrators interpret as "do not route here yet".
   */
  app.get('/ready', async (_req, res) => {
    if (!checkDatabase) {
      res.status(200).json({ status: 'ok', database: 'unchecked' });
      return;
    }

    try {
      await checkDatabase();
      res.status(200).json({ status: 'ok', database: 'reachable' });
    } catch (error) {
      // Detail is deliberately withheld from the response — connection errors
      // can carry hostnames and credentials. The cause is logged instead.
      logger.error({ err: error }, 'Readiness check failed: database unreachable');
      res.status(503).json({ status: 'unavailable', database: 'unreachable' });
    }
  });

  app.use('/api/v1/profile', createProfileRouter(profileRepository, eventPublisher));

  if (authDependencies) {
    app.use('/api/v1/auth', createAuthRouter(authDependencies));
  }

  if (communityDependencies) {
    app.use('/api/v1/communities', createCommunityRouter(communityDependencies));
  }

  if (authorizationDependencies) {
    app.use('/api/v1/authorization', createAuthorizationRouter(authorizationDependencies));
  }

  // Must be registered last — Express identifies error-handling middleware
  // by its four-argument signature.
  app.use(errorHandler);

  return app;
}
