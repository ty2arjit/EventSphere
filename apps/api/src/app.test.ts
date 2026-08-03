import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from './app';
import { InMemoryProfileRepository } from './modules/profile/test-support/InMemoryProfileRepository';
import { RecordingEventPublisher } from './modules/profile/test-support/RecordingEventPublisher';

function buildTestApp() {
  return createApp({
    profileRepository: new InMemoryProfileRepository(),
    eventPublisher: new RecordingEventPublisher(),
    corsOrigins: ['http://localhost:3000'],
  });
}

describe('GET /health', () => {
  it('returns 200 ok', async () => {
    const app = buildTestApp();
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
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
