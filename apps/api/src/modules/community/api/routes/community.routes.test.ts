import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../../../app';
import { InMemoryProfileRepository } from '../../../profile/test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from '../../../profile/test-support/RecordingEventPublisher';
import { InMemoryCommunityRepository } from '../../test-support/InMemoryCommunityRepository';
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

/**
 * Regression coverage for a real bug: listMyCommunities returned a bare
 * array (`res.json(communities.map(...))`) while the frontend client
 * expected `{ data: [...] }` like every other list endpoint in this app.
 * Nothing caught it — this endpoint had zero test coverage — until an
 * authenticated visit to /communities crashed with "Cannot read properties
 * of undefined (reading 'length')".
 */
function buildAuthedCommunityApp() {
  const profileRepository = new InMemoryProfileRepository();
  const eventPublisher = new RecordingEventPublisher();
  const communityRepository = new InMemoryCommunityRepository();
  const credentialRepository = new InMemoryUserCredentialRepository();
  const jwtService = new FakeJwtService();

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
    communityDependencies: {
      communityRepository,
      eventPublisher,
    },
  });

  return app;
}

async function registerAndLogin(app: ReturnType<typeof buildAuthedCommunityApp>, email: string) {
  await request(app)
    .post('/api/v1/auth/register')
    .set('X-Requested-With', 'XMLHttpRequest')
    .send({ email, password: 'SuperSecret123!', name: 'Test User' });

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .set('X-Requested-With', 'XMLHttpRequest')
    .send({ email, password: 'SuperSecret123!' });

  const cookies = loginRes.headers['set-cookie'] as unknown as string[];
  return cookies;
}

describe('GET /api/v1/communities (listMyCommunities)', () => {
  it('returns { data: [...] }, not a bare array', async () => {
    const app = buildAuthedCommunityApp();
    const cookies = await registerAndLogin(app, 'communities-shape@example.com');

    const res = await request(app).get('/api/v1/communities').set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('returns the communities the authenticated user owns or has joined', async () => {
    const app = buildAuthedCommunityApp();
    const cookies = await registerAndLogin(app, 'communities-owned@example.com');

    await request(app)
      .post('/api/v1/communities')
      .set('Cookie', cookies)
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ name: 'My Club', slug: 'my-club', description: null });

    const res = await request(app).get('/api/v1/communities').set('Cookie', cookies);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0]).toMatchObject({ name: 'My Club', slug: 'my-club' });
  });

  it('requires authentication', async () => {
    const app = buildAuthedCommunityApp();
    const res = await request(app).get('/api/v1/communities');
    expect(res.status).toBe(401);
  });
});
