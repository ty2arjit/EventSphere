import { afterEach, describe, expect, it, vi } from 'vitest';
import { request } from './http';

/**
 * Verifies the transport layer's central error classification. Every endpoint
 * module inherits this behaviour, so these cases are tested once here rather
 * than repeated per endpoint.
 */

function mockFetch(impl: typeof fetch) {
  vi.stubGlobal('fetch', impl);
}

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('request — success', () => {
  it('returns ok:true with parsed data on 200', async () => {
    mockFetch(async () => jsonResponse(200, { id: '1', name: 'Test' }));

    const result = await request<{ id: string; name: string }>('/api/v1/thing');

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data).toEqual({ id: '1', name: 'Test' });
    }
  });

  it('returns ok:true on 201', async () => {
    mockFetch(async () => jsonResponse(201, { id: 'created' }));

    const result = await request<{ id: string }>('/api/v1/thing', { method: 'POST', body: {} });

    expect(result.ok).toBe(true);
  });

  it('sends JSON content-type and serialized body when a body is provided', async () => {
    const spy = vi.fn(async () => jsonResponse(201, {}));
    mockFetch(spy as unknown as typeof fetch);

    await request('/api/v1/thing', { method: 'POST', body: { email: 'a@b.co' } });

    const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe('POST');
    expect(init.body).toBe(JSON.stringify({ email: 'a@b.co' }));
    expect(init.headers).toEqual({ 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/json' });
  });

  it('omits content-type but keeps the CSRF header for bodyless requests', async () => {
    const spy = vi.fn(async () => jsonResponse(200, {}));
    mockFetch(spy as unknown as typeof fetch);

    await request('/api/v1/thing');

    const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.body).toBeUndefined();
    expect(init.headers).toEqual({ 'X-Requested-With': 'XMLHttpRequest' });
  });

  it('sends the CSRF header on every request — a bare cross-site <form> cannot set custom headers, so this forces a CORS preflight', async () => {
    const spy = vi.fn(async () => jsonResponse(200, {}));
    mockFetch(spy as unknown as typeof fetch);

    await request('/api/v1/thing');

    const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect((init.headers as Record<string, string>)['X-Requested-With']).toBe('XMLHttpRequest');
  });
});

describe('request — HTTP error classification', () => {
  it('maps 400 to VALIDATION and preserves the backend error code', async () => {
    mockFetch(async () =>
      jsonResponse(400, { error: 'INVALID_EMAIL', message: 'Invalid email address' }),
    );

    const result = await request('/api/v1/thing', { method: 'POST', body: {} });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('VALIDATION');
      expect(result.error.code).toBe('INVALID_EMAIL');
      expect(result.error.status).toBe(400);
    }
  });

  it('maps 409 to CONFLICT — the duplicate-email path', async () => {
    mockFetch(async () =>
      jsonResponse(409, { error: 'EMAIL_ALREADY_REGISTERED', message: 'Email already registered' }),
    );

    const result = await request('/api/v1/thing', { method: 'POST', body: {} });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('CONFLICT');
      expect(result.error.code).toBe('EMAIL_ALREADY_REGISTERED');
    }
  });

  it('maps 500 to SERVER', async () => {
    mockFetch(async () => jsonResponse(500, { error: 'INTERNAL_ERROR', message: 'Boom' }));

    const result = await request('/api/v1/thing');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('SERVER');
  });

  it.each([
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
  ])('maps %i to %s', async (status, expectedKind) => {
    mockFetch(async () => jsonResponse(status, { error: 'X', message: 'y' }));

    const result = await request('/api/v1/thing');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe(expectedKind);
  });
});

describe('request — malformed responses', () => {
  it('handles an error response with a non-JSON body (e.g. proxy HTML page)', async () => {
    mockFetch(async () => new Response('<html>502 Bad Gateway</html>', { status: 502 }));

    const result = await request('/api/v1/thing');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('SERVER');
      expect(result.error.code).toBe('MALFORMED_RESPONSE');
    }
  });

  it('handles a success status with an unparseable body', async () => {
    mockFetch(async () => new Response('not json', { status: 200 }));

    const result = await request('/api/v1/thing');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('MALFORMED_RESPONSE');
    }
  });

  it('handles an error body missing the expected error field', async () => {
    mockFetch(async () => jsonResponse(400, { unexpected: 'shape' }));

    const result = await request('/api/v1/thing');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('VALIDATION');
      expect(result.error.code).toBe('MALFORMED_RESPONSE');
    }
  });

  it('returns undefined data for 204 No Content', async () => {
    mockFetch(async () => new Response(null, { status: 204 }));

    const result = await request('/api/v1/thing', { method: 'DELETE' });

    expect(result.ok).toBe(true);
  });
});

describe('request — expired access token retry', () => {
  it('retries once after a successful refresh, and returns the retried response', async () => {
    const calls: string[] = [];
    mockFetch(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.endsWith('/api/v1/auth/refresh')) {
        calls.push('refresh');
        return jsonResponse(200, { ok: true });
      }
      calls.push('thing');
      // First call to the real endpoint fails (expired token); retry succeeds.
      return calls.filter((c) => c === 'thing').length === 1
        ? jsonResponse(401, { error: 'AUTHENTICATION_REQUIRED', message: 'expired' })
        : jsonResponse(200, { id: '1' });
    });

    const result = await request<{ id: string }>('/api/v1/thing');

    expect(calls).toEqual(['thing', 'refresh', 'thing']);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data).toEqual({ id: '1' });
  });

  it('returns the original 401 when refresh itself fails, without looping', async () => {
    const calls: string[] = [];
    mockFetch(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      if (url.endsWith('/api/v1/auth/refresh')) {
        calls.push('refresh');
        return jsonResponse(401, { error: 'REFRESH_TOKEN_INVALID', message: 'expired' });
      }
      calls.push('thing');
      return jsonResponse(401, { error: 'AUTHENTICATION_REQUIRED', message: 'expired' });
    });

    const result = await request('/api/v1/thing');

    // Exactly one retry attempt at refresh, then no further retry of /thing.
    expect(calls).toEqual(['thing', 'refresh']);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('does not attempt refresh for the refresh/login/register endpoints themselves', async () => {
    const calls: string[] = [];
    mockFetch(async (input) => {
      const url = typeof input === 'string' ? input : (input as Request).url;
      calls.push(url);
      return jsonResponse(401, { error: 'INVALID_CREDENTIALS', message: 'bad password' });
    });

    const result = await request('/api/v1/auth/login', { method: 'POST', body: {} });

    expect(calls).toHaveLength(1);
    expect(result.ok).toBe(false);
  });
});

describe('request — network failures', () => {
  it('classifies an unreachable server as NETWORK, not a thrown error', async () => {
    mockFetch(async () => {
      throw new TypeError('fetch failed');
    });

    const result = await request('/api/v1/thing');

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.kind).toBe('NETWORK');
      expect(result.error.code).toBe('NETWORK_UNREACHABLE');
      expect(result.error.status).toBeUndefined();
    }
  });

  it('never throws — transport failures are returned as values', async () => {
    mockFetch(async () => {
      throw new Error('catastrophic');
    });

    await expect(request('/api/v1/thing')).resolves.toMatchObject({ ok: false });
  });
});
