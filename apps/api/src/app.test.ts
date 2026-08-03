import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app';
import { InMemoryProfileRepository } from './modules/profile/test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from './modules/profile/test-support/RecordingEventPublisher';

function buildTestApp(checkDatabase?: () => Promise<void>) {
  return createApp({
    profileRepository: new InMemoryProfileRepository(),
    eventPublisher: new RecordingEventPublisher(),
    corsOrigins: ['http://localhost:3000'],
    checkDatabase,
  });
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
      .post('/api/v1/profile')
      .set('Origin', 'http://localhost:3000')
      .send({ email: 'cors@example.com', name: 'CORS Test' });

    expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    expect(res.headers['access-control-allow-credentials']).toBe('true');
  });

  it('does not authorize an unconfigured origin', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/api/v1/profile')
      .set('Origin', 'https://evil.example.com')
      .send({ email: 'evil@example.com', name: 'Evil' });

    expect(res.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('POST /api/v1/profile', () => {
  it('returns 201 with the created profile for valid input', async () => {
    const app = buildTestApp();

    const res = await request(app)
      .post('/api/v1/profile')
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
      .post('/api/v1/profile')
      .send({ email: 'not-an-email', name: '' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 409 for a duplicate email', async () => {
    const app = buildTestApp();

    await request(app)
      .post('/api/v1/profile')
      .send({ email: 'dup@example.com', name: 'First' });

    const res = await request(app)
      .post('/api/v1/profile')
      .send({ email: 'dup@example.com', name: 'Second' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('EMAIL_ALREADY_REGISTERED');
  });
});
