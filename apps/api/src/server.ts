import 'dotenv/config';
import { createApp } from './app';
import { prisma } from './infrastructure/prisma/client';
import { PrismaProfileRepository } from './modules/profile/infrastructure/PrismaProfileRepository';
import { InProcessEventPublisher } from './shared/events/EventPublisher';
import { PROFILE_REGISTERED } from './modules/profile/domain/events/ProfileRegistered';
import { logProfileRegistered } from './modules/profile/application/subscribers/logProfileRegistered';
import { logger } from './shared/logger';

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const eventPublisher = new InProcessEventPublisher((event, error) => {
  logger.error({ err: error, eventId: event.eventId, eventType: event.eventType }, 'Subscriber failed');
});

eventPublisher.subscribe(PROFILE_REGISTERED, logProfileRegistered);

const app = createApp({
  profileRepository: new PrismaProfileRepository(prisma),
  eventPublisher,
  corsOrigins,
});

const server = app.listen(port, () => {
  logger.info({ port, corsOrigins }, 'API listening');
});

/**
 * Close the HTTP server and release the database pool on shutdown so
 * in-flight requests finish and connections aren't leaked on redeploy.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
