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
import { createEventRouter, EventRouterDependencies } from './modules/event-management/api/routes/event.routes';
import { createCommitteeRouter, CommitteeRouterDependencies } from './modules/committee/api/routes/committee.routes';
import { createParticipationRouter, ParticipationRouterDependencies } from './modules/participation/api/routes/participation.routes';
import { createVolunteerRouter, VolunteerRouterDependencies } from './modules/volunteer/api/routes/volunteer.routes';
import { createAnnouncementRouter, AnnouncementRouterDependencies } from './modules/announcement/api/routes/announcement.routes';
import { createAnalyticsRouter, AnalyticsRouterDependencies } from './modules/analytics/api/routes/analytics.routes';
import { createRecommendationRouter, RecommendationRouterDependencies } from './modules/recommendation/api/routes/recommendation.routes';
import { createUploadsRouter, UploadsRouterDependencies } from './modules/uploads/api/routes/uploads.routes';
import { createPaymentRouter, createPaymentWebhookApp, PaymentRouterDependencies } from './modules/payment/api/routes/payment.routes';
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
  eventDependencies?: EventRouterDependencies;
  committeeDependencies?: CommitteeRouterDependencies;
  participationDependencies?: ParticipationRouterDependencies;
  volunteerDependencies?: VolunteerRouterDependencies;
  announcementDependencies?: AnnouncementRouterDependencies;
  analyticsDependencies?: AnalyticsRouterDependencies;
  recommendationDependencies?: RecommendationRouterDependencies;
  uploadsDependencies?: UploadsRouterDependencies;
  paymentDependencies?: PaymentRouterDependencies;
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
  eventDependencies,
  committeeDependencies,
  participationDependencies,
  volunteerDependencies,
  announcementDependencies,
  analyticsDependencies,
  recommendationDependencies,
  uploadsDependencies,
  paymentDependencies,
}: AppDependencies): Express {
  const app = express();

  // Railway terminates TLS and proxies every request through its own edge —
  // without this, req.ip (and X-Forwarded-For) resolve to Railway's internal
  // proxy address for every visitor, not the real client. That collapses
  // express-rate-limit's per-IP keying into one shared bucket for all users
  // combined: once any 10 requests land within the window, everyone gets
  // rate-limited together, not 10 requests per person. `1` trusts exactly one
  // hop (Railway's edge), matching the actual proxy topology here.
  app.set('trust proxy', 1);

  // Suppresses the `x-powered-by: Express` response header. Volunteering the
  // server technology only helps someone matching known Express CVEs.
  app.disable('x-powered-by');

  // Baseline security headers (HSTS, nosniff, frame-ancestors, etc.). Placed
  // first so headers apply to every response, including errors.
  app.use(helmet());

  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(cookieParser());

  // Razorpay webhook — mounted BEFORE express.json() and the CSRF guard.
  // Signature verification hashes the exact raw bytes Razorpay signed, so the
  // body must not be JSON-parsed first; and Razorpay can't send our
  // X-Requested-With header, so authenticity comes from the HMAC instead.
  if (paymentDependencies) {
    app.use('/api/v1/payments/webhook', createPaymentWebhookApp(paymentDependencies));
  }

  app.use(express.json());

  // Defense-in-depth against CSRF, alongside the CORS origin allowlist above.
  // Auth cookies are SameSite=None (required for the Vercel/Railway
  // cross-site split), which means the browser attaches them to a plain
  // cross-site <form> POST too — CORS only gates whether *script* on another
  // origin can read the response, not whether the browser sends a "simple"
  // request in the first place. The frontend sets this header on every call
  // (see apps/web/lib/api/http.ts); a bare HTML form cannot set custom
  // headers at all, so this alone blocks that attack vector even if CORS
  // were ever misconfigured to trust an unintended origin.
  app.use((req, res, next) => {
    const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
    if (isStateChanging && req.headers['x-requested-with'] !== 'XMLHttpRequest') {
      res.status(403).json({ error: 'CSRF_HEADER_MISSING', message: 'Missing required X-Requested-With header' });
      return;
    }
    next();
  });

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

  if (eventDependencies) {
    app.use('/api/v1/events', createEventRouter(eventDependencies));
  }

  if (committeeDependencies) {
    app.use('/api/v1/committees', createCommitteeRouter(committeeDependencies));
  }

  if (participationDependencies) {
    app.use('/api/v1/participation', createParticipationRouter(participationDependencies));
  }

  if (volunteerDependencies) {
    app.use('/api/v1/tasks', createVolunteerRouter(volunteerDependencies));
  }

  if (announcementDependencies) {
    app.use('/api/v1/announcements', createAnnouncementRouter(announcementDependencies));
  }

  if (analyticsDependencies) {
    app.use('/api/v1/analytics', createAnalyticsRouter(analyticsDependencies));
  }

  if (recommendationDependencies) {
    app.use('/api/v1/ai', createRecommendationRouter(recommendationDependencies));
  }

  if (uploadsDependencies) {
    app.use('/api/v1/uploads', createUploadsRouter(uploadsDependencies));
  }

  if (paymentDependencies) {
    app.use('/api/v1/payments', createPaymentRouter(paymentDependencies));
  }

  // Must be registered last — Express identifies error-handling middleware
  // by its four-argument signature.
  app.use(errorHandler);

  return app;
}
