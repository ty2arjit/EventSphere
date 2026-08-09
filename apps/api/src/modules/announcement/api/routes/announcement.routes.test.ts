import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../../app';
import { InMemoryProfileRepository } from '../../../profile/test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from '../../../profile/test-support/RecordingEventPublisher';
import { InMemoryCommunityRepository } from '../../../community/test-support/InMemoryCommunityRepository';
import { InMemoryEventRepository } from '../../../event-management/test-support/InMemoryEventRepository';
import { InMemoryAnnouncementRepository } from '../../test-support/InMemoryAnnouncementRepository';
import { InMemoryUserCredentialRepository } from '../../../authentication/test-support/InMemoryUserCredentialRepository';
import {
  FakePasswordHasher,
  FakeTokenHasher,
  SequentialTokenGenerator,
  RecordingMailer,
  FakeJwtService,
  InMemoryProfileGateway,
} from '../../../authentication/test-support/fakes';
import { DEFAULT_AUTH_CONFIG } from '../../../authentication/application/AuthConfig';
import { AuthorizeResourceActionService } from '../../../authorization/application/AuthorizeResourceActionService';
import { InMemoryPermissionPolicyRepository } from '../../../authorization/test-support/InMemoryPermissionPolicyRepository';

/**
 * Regression coverage for a real bug: the controller read authorId from
 * req.body — but the frontend (correctly) never sends it, since the author
 * is whoever is authenticated, not something the client should be trusted
 * to supply. Every announcement creation from the actual UI failed with a
 * Prisma "Argument authorId is missing" 500, forever — nothing caught it
 * because this endpoint had zero test coverage.
 */
function buildApp() {
  const profileRepository = new InMemoryProfileRepository();
  const eventPublisher = new RecordingEventPublisher();
  const communityRepository = new InMemoryCommunityRepository();
  const announcementRepository = new InMemoryAnnouncementRepository();
  const credentialRepository = new InMemoryUserCredentialRepository();
  const permissionPolicyRepository = new InMemoryPermissionPolicyRepository();
  const jwtService = new FakeJwtService();
  const authorizeService = new AuthorizeResourceActionService(permissionPolicyRepository, communityRepository);

  return createApp({
    profileRepository,
    eventPublisher,
    corsOrigins: ['http://localhost:3000'],
    jwtService,
    authDependencies: {
      credentialRepository,
      passwordHasher: new FakePasswordHasher(),
      tokenHasher: new FakeTokenHasher(),
      tokenGenerator: new SequentialTokenGenerator(),
      jwtService,
      mailer: new RecordingMailer(),
      eventPublisher,
      authConfig: DEFAULT_AUTH_CONFIG,
      profileGateway: new InMemoryProfileGateway(),
    },
    communityDependencies: { communityRepository, eventPublisher },
    announcementDependencies: { announcementRepository, eventRepository: new InMemoryEventRepository(), eventPublisher, authorizeService },
  });
}

async function registerLoginAndCreateCommunity(app: ReturnType<typeof buildApp>, email: string) {
  await request(app)
    .post('/api/v1/auth/register')
    .set('X-Requested-With', 'XMLHttpRequest')
    .send({ email, password: 'SuperSecret123!', name: 'Test User' });

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .set('X-Requested-With', 'XMLHttpRequest')
    .send({ email, password: 'SuperSecret123!' });
  const cookies = loginRes.headers['set-cookie'] as unknown as string[];

  const communityRes = await request(app)
    .post('/api/v1/communities')
    .set('Cookie', cookies)
    .set('X-Requested-With', 'XMLHttpRequest')
    .send({ name: 'My Club', slug: 'my-club', description: null });

  return { cookies, communityId: communityRes.body.id as string };
}

describe('POST /api/v1/announcements', () => {
  it('derives the author from the authenticated session, not the request body', async () => {
    const app = buildApp();
    const { cookies, communityId } = await registerLoginAndCreateCommunity(app, 'announce-author@example.com');

    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Cookie', cookies)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ title: 'Welcome', body: 'Hello everyone', communityId, priority: 'Normal', channels: ['InApp'] });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ title: 'Welcome', isDraft: true });
  });

  it('ignores a client-supplied authorId entirely (would previously have been trusted)', async () => {
    const app = buildApp();
    const { cookies, communityId } = await registerLoginAndCreateCommunity(app, 'announce-spoof@example.com');

    const res = await request(app)
      .post('/api/v1/announcements')
      .set('Cookie', cookies)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ title: 'Welcome', body: 'Hello', communityId, authorId: 'someone-elses-id' });

    expect(res.status).toBe(201);
  });
});
