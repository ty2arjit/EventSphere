import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app';
import { InMemoryProfileRepository } from './modules/profile/test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from './modules/profile/test-support/RecordingEventPublisher';
import { User } from './modules/profile/domain/User';
import { FakeJwtService } from './modules/authentication/test-support/fakes';

const jwtService = new FakeJwtService();

function buildTestApp(checkDatabase?: () => Promise<void>) {
  return createApp({
    profileRepository: new InMemoryProfileRepository(),
    eventPublisher: new RecordingEventPublisher(),
    corsOrigins: ['http://localhost:3000'],
    checkDatabase,
    jwtService,
  });
}

// Profile mutation routes now require the caller to be authenticated as the
// profile they're acting on. FakeJwtService.verifyAccessToken just parses a
// deterministic string — no real session/credential needed — so tests can
// authenticate "as" a walking-skeleton-registered profile (which has no
// UserCredential at all) by building this cookie directly.
async function selfAuthCookie(id: string): Promise<string> {
  const token = await jwtService.issueAccessToken({ sub: id, sessionId: 'test-session', emailVerified: false }, 900);
  return `es_access=${token}`;
}

describe('GET /health (liveness)', () => {
  it('returns 200 ok', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('stays 200 even when the database is down — liveness must not depend on it', async () => {
    const app = buildTestApp(async () => {
      throw new Error('connection refused');
    });

    // A liveness probe that failed here would make the platform kill and
    // restart a healthy process during a database blip.
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });
});

describe('GET /ready (readiness)', () => {
  it('returns 200 when the database is reachable', async () => {
    const app = buildTestApp(async () => {
      /* resolves — database reachable */
    });

    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'reachable' });
  });

  it('returns 503 when the database is unreachable', async () => {
    const app = buildTestApp(async () => {
      throw new Error('connection refused');
    });

    const res = await request(app).get('/ready');
    expect(res.status).toBe(503);
    expect(res.body).toEqual({ status: 'unavailable', database: 'unreachable' });
  });

  it('never leaks connection details in the failure response', async () => {
    const app = buildTestApp(async () => {
      throw new Error("Can't reach database server at ep-secret-host.neon.tech:5432");
    });

    const res = await request(app).get('/ready');
    expect(JSON.stringify(res.body)).not.toContain('neon.tech');
    expect(JSON.stringify(res.body)).not.toContain('5432');
  });

  it('reports the dependency as unchecked when no checker is supplied', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/ready');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', database: 'unchecked' });
  });
});

describe('CORS', () => {
  it('allows a configured origin and permits credentials', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/api/v1/profile').set('X-Requested-With', 'XMLHttpRequest')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'cors@example.com', name: 'CORS Test' });

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not authorize an unconfigured origin', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/api/v1/profile').set('X-Requested-With', 'XMLHttpRequest')
      .set('Origin', 'https://evil.example.com')
      .send({ email: 'evil@example.com', name: 'Evil' });

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('CSRF protection', () => {
  it('rejects a state-changing request missing X-Requested-With — the header a bare cross-site <form> cannot set', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/api/v1/profile')
      .send({ email: 'csrf@example.com', name: 'CSRF Test' });

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('CSRF_HEADER_MISSING');
  });

  it('allows a state-changing request that carries the header', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/api/v1/profile')
      .set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'csrf-ok@example.com', name: 'CSRF OK' });

    expect(res.status).toBe(201);
  });

  it('does not require the header on GET — only state-changing methods are gated', async () => {
    const app = buildTestApp();

    const res = await request(app).get('/api/v1/profile/does-not-exist');

    expect(res.status).not.toBe(403);
  });
});

describe('POST /api/v1/profile', () => {
  it('returns 201 with the created profile for valid input', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/api/v1/profile').set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'api-test@example.com', name: 'API Test' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: 'api-test@example.com',
      name: 'API Test',
    });
    expect(res.body.id).toBeTruthy();
    expect(res.body.createdAt).toBeTruthy();
  });

  it('returns 400 for invalid input', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/api/v1/profile').set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'not-an-email', name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 409 for a duplicate email', async () => {
    const app = buildTestApp();

    await request(app)
      .post('/api/v1/profile').set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'dup@example.com', name: 'First' });

    const res = await request(app)
      .post('/api/v1/profile').set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'dup@example.com', name: 'Second' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('EMAIL_ALREADY_REGISTERED');
  });

  it('returns a full profile shape including defaulted profile/preferences', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/api/v1/profile').set('X-Requested-With', 'XMLHttpRequest')
      .send({ email: 'full-shape@example.com', name: 'Full Shape' });

    expect(res.body).toMatchObject({
      status: 'registered',
      verifiedAt: null,
      profile: { avatarUrl: null, bio: null },
      preferences: { language: 'en', timezone: 'UTC', theme: 'system' },
    });
    expect(res.body.updatedAt).toBeTruthy();
  });
});

async function registerProfile(app: ReturnType<typeof buildTestApp>, email: string) {
  const res = await request(app).post('/api/v1/profile').set('X-Requested-With', 'XMLHttpRequest').send({ email, name: 'Test User' });
  return res.body.id as string;
}

describe('GET /api/v1/profile/:id', () => {
  it('returns 200 with the profile for a known id', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'get-known@example.com');

    const res = await request(app).get(`/api/v1/profile/${id}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(id);
  });

  it('returns 404 for an unknown id', async () => {
    const app = buildTestApp();

    const res = await request(app).get('/api/v1/profile/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('PROFILE_NOT_FOUND');
  });
});

describe('PATCH /api/v1/profile/:id', () => {
  it('updates bio/headline and returns 200', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'patch-profile@example.com');

    const res = await request(app)
      .patch(`/api/v1/profile/${id}`).set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', await selfAuthCookie(id))
      .send({ bio: 'Hello world', headline: 'Engineer' });

    expect(res.status).toBe(200);
    expect(res.body.profile).toMatchObject({ bio: 'Hello world', headline: 'Engineer' });
  });

  it('returns 400 for an out-of-range graduation year', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'patch-invalid@example.com');

    const res = await request(app)
      .patch(`/api/v1/profile/${id}`).set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', await selfAuthCookie(id))
      .send({ graduationYear: 1900 });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 403 for someone else\'s profile', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'patch-owned@example.com');

    const res = await request(app)
      .patch(`/api/v1/profile/${id}`).set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', await selfAuthCookie('someone-else'))
      .send({ bio: 'Hijacked' });

    expect(res.status).toBe(403);
  });

  it('returns 401 for an unauthenticated request', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'patch-unauth@example.com');

    const res = await request(app).patch(`/api/v1/profile/${id}`).set('X-Requested-With', 'XMLHttpRequest').send({ bio: 'Hi' });
    expect(res.status).toBe(401);
  });

  it('returns 404 for an unknown id', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .patch('/api/v1/profile/does-not-exist').set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', await selfAuthCookie('does-not-exist'))
      .send({ bio: 'Hi' });
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/profile/:id/avatar', () => {
  it('updates the avatar and returns 200', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'patch-avatar@example.com');

    const res = await request(app)
      .patch(`/api/v1/profile/${id}/avatar`).set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', await selfAuthCookie(id))
      .send({ avatarUrl: 'https://example.com/a.png' });

    expect(res.status).toBe(200);
    expect(res.body.profile.avatarUrl).toBe('https://example.com/a.png');
  });

  it('returns 400 for a malformed URL', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'patch-avatar-bad@example.com');

    const res = await request(app)
      .patch(`/api/v1/profile/${id}/avatar`).set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', await selfAuthCookie(id))
      .send({ avatarUrl: 'not-a-url' });

    expect(res.status).toBe(400);
  });
});

describe('PATCH /api/v1/profile/:id/preferences', () => {
  it('updates preferences and returns 200', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'patch-prefs@example.com');

    const res = await request(app)
      .patch(`/api/v1/profile/${id}/preferences`).set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', await selfAuthCookie(id))
      .send({ theme: 'dark', notifyInApp: false });

    expect(res.status).toBe(200);
    expect(res.body.preferences).toMatchObject({ theme: 'dark', notifyInApp: false });
  });

  it('returns 400 for an invalid theme', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'patch-prefs-bad@example.com');

    const res = await request(app)
      .patch(`/api/v1/profile/${id}/preferences`).set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', await selfAuthCookie(id))
      .send({ theme: 'neon' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/profile/:id/verify', () => {
  it('verifies the profile and returns 200', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'verify@example.com');

    const res = await request(app)
      .post(`/api/v1/profile/${id}/verify`).set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', await selfAuthCookie(id));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('verified');
    expect(res.body.verifiedAt).toBeTruthy();
  });

  it('returns 409 when already verified', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'verify-twice@example.com');
    const cookie = await selfAuthCookie(id);

    await request(app).post(`/api/v1/profile/${id}/verify`).set('X-Requested-With', 'XMLHttpRequest').set('Cookie', cookie);
    const res = await request(app)
      .post(`/api/v1/profile/${id}/verify`).set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', cookie);

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ALREADY_VERIFIED');
  });
});

describe('POST /api/v1/profile/:id/deactivate', () => {
  it('returns 400 when the profile is not active yet', async () => {
    const app = buildTestApp();
    const id = await registerProfile(app, 'deactivate-not-active@example.com');

    // freshly registered profiles start as 'registered', not 'active'
    const res = await request(app)
      .post(`/api/v1/profile/${id}/deactivate`).set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', await selfAuthCookie(id));

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_LIFECYCLE_TRANSITION');
  });

  it('deactivates an active profile and returns 200', async () => {
    // No /activate endpoint exists yet (not in this pass's route list), so
    // reaching 'active' status for this test goes through the repository
    // directly rather than HTTP.
    const repository = new InMemoryProfileRepository();
    const user = User.register('deactivate-active@example.com', 'Active User');
    user.verifyIdentity();
    user.activate();
    await repository.save(user);

    const app = createApp({
      profileRepository: repository,
      eventPublisher: new RecordingEventPublisher(),
      corsOrigins: ['http://localhost:3000'],
      jwtService,
    });

    const res = await request(app)
      .post(`/api/v1/profile/${user.id}/deactivate`).set('X-Requested-With', 'XMLHttpRequest')
      .set('Cookie', await selfAuthCookie(user.id));

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('inactive');
  });
});
