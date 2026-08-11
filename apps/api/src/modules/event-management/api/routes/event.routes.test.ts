import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../../app';
import { InMemoryProfileRepository } from '../../../profile/test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from '../../../profile/test-support/RecordingEventPublisher';
import { InMemoryCommunityRepository } from '../../../community/test-support/InMemoryCommunityRepository';
import { InMemoryEventRepository } from '../../test-support/InMemoryEventRepository';
import { InMemoryUserCredentialRepository } from '../../../authentication/test-support/InMemoryUserCredentialRepository';
import {
  FakePasswordHasher,
  FakeTokenHasher,
  SequentialTokenGenerator,
  SequentialOtpGenerator,
  RecordingMailer,
  FakeJwtService,
  InMemoryProfileGateway,
} from '../../../authentication/test-support/fakes';
import { DEFAULT_AUTH_CONFIG } from '../../../authentication/application/AuthConfig';
import { AuthorizeResourceActionService } from '../../../authorization/application/AuthorizeResourceActionService';
import { InMemoryPermissionPolicyRepository } from '../../../authorization/test-support/InMemoryPermissionPolicyRepository';

/**
 * GET /events/browse is the site-wide public discovery endpoint (mirrors
 * /communities/browse) — an anonymous visitor needs to be able to find an
 * event without already knowing its parent community.
 */
function buildApp() {
  const profileRepository = new InMemoryProfileRepository();
  const eventPublisher = new RecordingEventPublisher();
  const communityRepository = new InMemoryCommunityRepository();
  const eventRepository = new InMemoryEventRepository(communityRepository);
  const credentialRepository = new InMemoryUserCredentialRepository();
  const permissionPolicyRepository = new InMemoryPermissionPolicyRepository();
  const jwtService = new FakeJwtService();
  const authorizeService = new AuthorizeResourceActionService(permissionPolicyRepository, communityRepository);

  const app = createApp({
    profileRepository,
    eventPublisher,
    corsOrigins: ['http://localhost:3000'],
    jwtService,
    authDependencies: {
      credentialRepository,
      passwordHasher: new FakePasswordHasher(),
      tokenHasher: new FakeTokenHasher(),
      tokenGenerator: new SequentialTokenGenerator(),
      otpGenerator: new SequentialOtpGenerator(),
      jwtService,
      mailer: new RecordingMailer(),
      eventPublisher,
      authConfig: DEFAULT_AUTH_CONFIG,
      profileGateway: new InMemoryProfileGateway(),
    },
    communityDependencies: { communityRepository, eventPublisher },
    eventDependencies: { eventRepository, eventPublisher, authorizeService },
  });

  return { app, eventRepository };
}

async function registerLoginAndCreateCommunity(app: ReturnType<typeof buildApp>['app'], email: string) {
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

async function createAndPublishEvent(
  app: ReturnType<typeof buildApp>['app'],
  cookies: string[],
  communityId: string,
  name: string,
  slug: string,
) {
  const createRes = await request(app)
    .post('/api/v1/events')
    .set('Cookie', cookies)
    .set('X-Requested-With', 'XMLHttpRequest')
    .send({ communityId, name, slug });

  await request(app)
    .post(`/api/v1/events/${createRes.body.id}/transition`)
    .set('Cookie', cookies)
    .set('X-Requested-With', 'XMLHttpRequest')
    .send({ targetState: 'Published' });

  return createRes.body.id as string;
}

describe('GET /api/v1/events/browse', () => {
  it('lists published public events with no auth required', async () => {
    const { app } = buildApp();
    const { cookies, communityId } = await registerLoginAndCreateCommunity(app, 'events-browse@example.com');
    await createAndPublishEvent(app, cookies, communityId, 'Robotics Meetup', 'robotics-meetup');

    const res = await request(app).get('/api/v1/events/browse');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({
      name: 'Robotics Meetup',
      slug: 'robotics-meetup',
      communityId,
      communityName: 'My Club',
    });
    expect(res.body.total).toBe(1);
  });

  it('excludes events still in Draft state', async () => {
    const { app } = buildApp();
    const { cookies, communityId } = await registerLoginAndCreateCommunity(app, 'events-draft@example.com');
    await request(app)
      .post('/api/v1/events')
      .set('Cookie', cookies)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ communityId, name: 'Unfinished Draft', slug: 'unfinished-draft' });

    const res = await request(app).get('/api/v1/events/browse');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
  });

  it('filters by name substring, case-insensitively', async () => {
    const { app } = buildApp();
    const { cookies, communityId } = await registerLoginAndCreateCommunity(app, 'events-filter@example.com');
    await createAndPublishEvent(app, cookies, communityId, 'Coding Sprint', 'coding-sprint');
    await createAndPublishEvent(app, cookies, communityId, 'Chess Tournament', 'chess-tournament');

    const res = await request(app).get('/api/v1/events/browse?q=coding');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].slug).toBe('coding-sprint');
  });

  it('returns an empty page for a query matching nothing', async () => {
    const { app } = buildApp();
    const res = await request(app).get('/api/v1/events/browse?q=nonexistent');

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.total).toBe(0);
  });
});
