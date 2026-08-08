import 'dotenv/config';
import { createApp } from './app';
import { prisma } from './infrastructure/prisma/client';
import { PrismaProfileRepository } from './modules/profile/infrastructure/PrismaProfileRepository';
import { InProcessEventPublisher } from './shared/events/EventPublisher';
import { PROFILE_REGISTERED } from './modules/profile/domain/events/ProfileRegistered';
import { logProfileRegistered } from './modules/profile/application/subscribers/logProfileRegistered';
import { PrismaUserCredentialRepository } from './modules/authentication/infrastructure/PrismaUserCredentialRepository';
import { Argon2PasswordHasher } from './modules/authentication/infrastructure/Argon2PasswordHasher';
import { Sha256TokenHasher } from './modules/authentication/infrastructure/Sha256TokenHasher';
import { CryptoRandomTokenGenerator } from './modules/authentication/infrastructure/CryptoRandomTokenGenerator';
import { JoseJwtService } from './modules/authentication/infrastructure/JoseJwtService';
import { ConsoleMailer } from './modules/authentication/infrastructure/ConsoleMailer';
import { ProfileGatewayAdapter } from './modules/authentication/infrastructure/ProfileGatewayAdapter';
import { RegisterProfileService } from './modules/profile/application/RegisterProfileService';
import { PrismaCommunityRepository } from './modules/community/infrastructure/PrismaCommunityRepository';
import { PrismaPermissionPolicyRepository } from './modules/authorization/infrastructure/PrismaPermissionPolicyRepository';
import { VerifyIdentityService } from './modules/profile/application/VerifyIdentityService';
import { EMAIL_VERIFIED } from './modules/authentication/domain/events/EmailVerified';
import { makeVerifyProfileOnEmailVerified } from './modules/authentication/application/subscribers/verifyProfileOnEmailVerified';
import { AuthConfig } from './modules/authentication/application/AuthConfig';
import { logger } from './shared/logger';

const port = process.env.PORT ? Number(process.env.PORT) : 4000;

const jwtAccessSecret = process.env.JWT_ACCESS_SECRET;
if (!jwtAccessSecret) {
  logger.error('JWT_ACCESS_SECRET is required. Generate with: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"');
  process.exit(1);
}

const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter((origin) => origin.length > 0);

const eventPublisher = new InProcessEventPublisher((event, error) => {
  logger.error({ err: error, eventId: event.eventId, eventType: event.eventType }, 'Subscriber failed');
});

eventPublisher.subscribe(PROFILE_REGISTERED, logProfileRegistered);

const profileRepository = new PrismaProfileRepository(prisma);
const credentialRepository = new PrismaUserCredentialRepository(prisma);
const communityRepository = new PrismaCommunityRepository(prisma);
const permissionPolicyRepository = new PrismaPermissionPolicyRepository(prisma);
const passwordHasher = new Argon2PasswordHasher();
const tokenHasher = new Sha256TokenHasher();
const tokenGenerator = new CryptoRandomTokenGenerator();
const jwtService = new JoseJwtService(jwtAccessSecret);
const mailer = new ConsoleMailer(logger);

const authConfig: AuthConfig = {
  accessTokenTtlSeconds: 15 * 60,
  refreshTokenTtlSeconds: 30 * 24 * 60 * 60,
  emailVerificationTtlSeconds: 24 * 60 * 60,
  passwordResetTtlSeconds: 60 * 60,
  webBaseUrl: process.env.WEB_BASE_URL ?? 'http://localhost:3000',
};

const profileGateway = new ProfileGatewayAdapter(
  new RegisterProfileService(profileRepository, eventPublisher),
  profileRepository,
);

const verifyIdentityService = new VerifyIdentityService(profileRepository, eventPublisher);
eventPublisher.subscribe(EMAIL_VERIFIED, makeVerifyProfileOnEmailVerified(verifyIdentityService));

const app = createApp({
  profileRepository,
  eventPublisher,
  corsOrigins,
  checkDatabase: async () => {
    await prisma.$queryRaw`SELECT 1`;
  },
  jwtService,
  authDependencies: {
    credentialRepository,
    passwordHasher,
    tokenHasher,
    tokenGenerator,
    jwtService,
    mailer,
    eventPublisher,
    authConfig,
    profileGateway,
  },
  communityDependencies: {
    communityRepository,
    eventPublisher,
  },
  authorizationDependencies: {
    permissionPolicyRepository,
  },
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
