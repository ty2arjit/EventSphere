import { afterEach, describe, expect, it, vi } from 'vitest';
import { registerProfile } from './profileClient';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('registerProfile', () => {
  it('POSTs to /api/v1/profile with the supplied input', async () => {
    const spy = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            id: 'abc',
            email: 'test@example.com',
            name: 'Test User',
            createdAt: '2026-01-01T00:00:00.000Z',
          }),
          { status: 201, headers: { 'Content-Type': 'application/json' } },
        ),
    );
    vi.stubGlobal('fetch', spy);

    const result = await registerProfile({ email: 'test@example.com', name: 'Test User' });

    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/profile$/);
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ email: 'test@example.com', name: 'Test User' }));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.id).toBe('abc');
      expect(result.data.email).toBe('test@example.com');
    }
  });

  it('surfaces a duplicate email as a CONFLICT result rather than throwing', async () => {
    vi.stubGlobal(
      'fetch',
      async () =>
        new Response(
          JSON.stringify({
            error: 'EMAIL_ALREADY_REGISTERED',
            message: 'Email already registered: test@example.com',
          }),
          { status: 409, headers: { 'Content-Type': 'application/json' } },
        ),
    );

    const result = await registerProfile({ email: 'test@example.com', name: 'Test' });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('CONFLICT');
      expect(result.error.code).toBe('EMAIL_ALREADY_REGISTERED');
    }
  });

  it('surfaces an unreachable backend as a NETWORK result', async () => {
    vi.stubGlobal('fetch', async () => {
      throw new TypeError('fetch failed');
    });

    const result = await registerProfile({ email: 'test@example.com', name: 'Test' });

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('NETWORK');
  });
});
