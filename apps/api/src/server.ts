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
import { CryptoOtpGenerator } from './modules/authentication/infrastructure/CryptoOtpGenerator';
import { JoseJwtService } from './modules/authentication/infrastructure/JoseJwtService';
import { ConsoleMailer } from './modules/authentication/infrastructure/ConsoleMailer';
import { ResendMailer } from './modules/authentication/infrastructure/ResendMailer';
import type { Mailer } from './modules/authentication/infrastructure/Mailer';
import { ProfileGatewayAdapter } from './modules/authentication/infrastructure/ProfileGatewayAdapter';
import { RegisterProfileService } from './modules/profile/application/RegisterProfileService';
import { PrismaCommunityRepository } from './modules/community/infrastructure/PrismaCommunityRepository';
import { PrismaPermissionPolicyRepository } from './modules/authorization/infrastructure/PrismaPermissionPolicyRepository';
import { PrismaEventRepository } from './modules/event-management/infrastructure/PrismaEventRepository';
import { PrismaEventCommitteeRepository } from './modules/committee/infrastructure/PrismaEventCommitteeRepository';
import { PrismaRegistrationRepository } from './modules/participation/infrastructure/PrismaRegistrationRepository';
import { PrismaEnrollmentRepository } from './modules/participation/infrastructure/PrismaEnrollmentRepository';
import { PrismaAttendanceRepository } from './modules/participation/infrastructure/PrismaAttendanceRepository';
import { PrismaCertificateRepository } from './modules/participation/infrastructure/PrismaCertificateRepository';
import { PrismaOperationalTaskRepository } from './modules/volunteer/infrastructure/PrismaOperationalTaskRepository';
import { PrismaAnnouncementRepository } from './modules/announcement/infrastructure/PrismaAnnouncementRepository';
import { PrismaMetricRepository } from './modules/analytics/infrastructure/PrismaMetricRepository';
import { AuthorizeResourceActionService } from './modules/authorization/application/AuthorizeResourceActionService';
import { seedDefaultPermissions } from './modules/authorization/application/PermissionSeeder';
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
const eventRepository = new PrismaEventRepository(prisma);
const committeeRepository = new PrismaEventCommitteeRepository(prisma);
const registrationRepository = new PrismaRegistrationRepository(prisma);
const enrollmentRepository = new PrismaEnrollmentRepository(prisma);
const attendanceRepository = new PrismaAttendanceRepository(prisma);
const certificateRepository = new PrismaCertificateRepository(prisma);
const taskRepository = new PrismaOperationalTaskRepository(prisma);
const announcementRepository = new PrismaAnnouncementRepository(prisma);
const metricRepository = new PrismaMetricRepository(prisma);
const authorizeService = new AuthorizeResourceActionService(
  permissionPolicyRepository,
  communityRepository,
  committeeRepository,
);
const passwordHasher = new Argon2PasswordHasher();
const tokenHasher = new Sha256TokenHasher();
const tokenGenerator = new CryptoRandomTokenGenerator();
const otpGenerator = new CryptoOtpGenerator();
const jwtService = new JoseJwtService(jwtAccessSecret);
// Switches to a real transport the moment RESEND_API_KEY is set — no other
// code change needed. RESEND_FROM_EMAIL must be a verified sender/domain
// in that Resend account; falls back to onboarding@resend.dev (Resend's
// own shared test sender, works with zero domain setup but only delivers
// to the account owner's own inbox — fine for initial verification, not
// for real users) if unset.
const mailer: Mailer = process.env.RESEND_API_KEY
  ? new ResendMailer(process.env.RESEND_API_KEY, process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev')
  : new ConsoleMailer(logger);

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
    otpGenerator,
    jwtService,
    mailer,
    eventPublisher,
    authConfig,
    profileGateway,
  },
  communityDependencies: {
    communityRepository,
    eventPublisher,
    authorizeResourceActionService: authorizeService,
  },
  authorizationDependencies: {
    permissionPolicyRepository,
    eventRepository,
    authorizeResourceActionService: authorizeService,
  },
  eventDependencies: {
    eventRepository,
    eventPublisher,
    authorizeService,
  },
  committeeDependencies: {
    committeeRepository,
    eventPublisher,
    authorizeService,
  },
  participationDependencies: {
    registrationRepository,
    enrollmentRepository,
    attendanceRepository,
    certificateRepository,
    eventRepository,
    eventPublisher,
    authorizeService,
    // Reuses the access-token secret rather than requiring a new env var —
    // QrTokenService scopes tokens with a distinct issuer/audience, so a
    // shared secret can't be replayed as a login token or vice versa.
    qrTokenSecret: jwtAccessSecret,
  },
  volunteerDependencies: {
    taskRepository,
    eventRepository,
    eventPublisher,
    authorizeService,
  },
  announcementDependencies: {
    announcementRepository,
    eventRepository,
    eventPublisher,
    authorizeService,
  },
  analyticsDependencies: {
    metricRepository,
  },
  recommendationDependencies: {
    metricRepository,
  },
});

let server: ReturnType<typeof app.listen>;

seedDefaultPermissions(permissionPolicyRepository)
  .catch((err) => logger.error({ err }, 'Failed to seed default permissions'))
  .finally(() => {
    server = app.listen(port, () => {
      logger.info({ port, corsOrigins }, 'API listening');
    });
  });

/**
 * Close the HTTP server and release the database pool on shutdown so
 * in-flight requests finish and connections aren't leaked on redeploy.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutting down');
  if (!server) {
    await prisma.$disconnect();
    process.exit(0);
    return;
  }
  server.close(() => {
    void prisma.$disconnect().finally(() => process.exit(0));
  });
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
