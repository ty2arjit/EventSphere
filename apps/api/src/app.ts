import express, { Express } from 'express';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { ProfileRepository } from './modules/profile/domain/ProfileRepository';
import { createProfileRouter } from './modules/profile/routes/profile.routes';
import { EventPublisher } from './shared/events/EventPublisher';
import { errorHandler } from './shared/errors/errorHandler';
import { logger } from './shared/logger';

export interface AppDependencies {
  profileRepository: ProfileRepository;
  eventPublisher: EventPublisher;
  /**
   * Allowed browser origins. Explicit allow-list rather than a wildcard —
   * `*` is incompatible with credentialed requests, which Phase 0 needs for
   * HTTP-only auth cookies (`SystemDesign.md`, Authentication).
   */
  corsOrigins: string[];
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
}: AppDependencies): Express {
  const app = express();

  app.use(cors({ origin: corsOrigins, credentials: true }));
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.use('/api/v1/profile', createProfileRouter(profileRepository, eventPublisher));

  // Must be registered last — Express identifies error-handling middleware
  // by its four-argument signature.
  app.use(errorHandler);

  return app;
}
