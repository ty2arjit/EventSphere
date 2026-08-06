import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  registerProfile,
  getProfile,
  updateProfile,
  updateAvatar,
  updatePreferences,
  verifyProfile,
  deactivateProfile,
} from './profileClient';

const fullProfileResponse = {
  id: 'abc',
  email: 'test@example.com',
  name: 'Test User',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  status: 'registered',
  verifiedAt: null,
  profile: {
    avatarUrl: null,
    bio: null,
    headline: null,
    institution: null,
    department: null,
    graduationYear: null,
  },
  preferences: {
    language: 'en',
    timezone: 'UTC',
    theme: 'system',
    notifyByEmail: true,
    notifyInApp: true,
  },
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

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

describe('getProfile', () => {
  it('GETs /api/v1/profile/:id', async () => {
    const spy = vi.fn(async () => jsonResponse(fullProfileResponse));
    vi.stubGlobal('fetch', spy);

    const result = await getProfile('abc');

    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/profile\/abc$/);
    expect(init.method).toBe('GET');
    expect(result.ok).toBe(true);
  });

  it('surfaces a missing profile as a NOT_FOUND result', async () => {
    vi.stubGlobal(
      'fetch',
      async () => jsonResponse({ error: 'PROFILE_NOT_FOUND', message: 'not found' }, 404),
    );

    const result = await getProfile('does-not-exist');

    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe('NOT_FOUND');
  });
});

describe('updateProfile', () => {
  it('PATCHes /api/v1/profile/:id with the patch', async () => {
    const spy = vi.fn(async () => jsonResponse(fullProfileResponse));
    vi.stubGlobal('fetch', spy);

    await updateProfile('abc', { bio: 'Hello' });

    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/profile\/abc$/);
    expect(init.method).toBe('PATCH');
    expect(init.body).toBe(JSON.stringify({ bio: 'Hello' }));
  });
});

describe('updateAvatar', () => {
  it('PATCHes /api/v1/profile/:id/avatar', async () => {
    const spy = vi.fn(async () => jsonResponse(fullProfileResponse));
    vi.stubGlobal('fetch', spy);

    await updateAvatar('abc', { avatarUrl: 'https://example.com/a.png' });

    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/profile\/abc\/avatar$/);
    expect(init.method).toBe('PATCH');
  });
});

describe('updatePreferences', () => {
  it('PATCHes /api/v1/profile/:id/preferences', async () => {
    const spy = vi.fn(async () => jsonResponse(fullProfileResponse));
    vi.stubGlobal('fetch', spy);

    await updatePreferences('abc', { theme: 'dark' });

    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/profile\/abc\/preferences$/);
    expect(init.method).toBe('PATCH');
  });
});

describe('verifyProfile', () => {
  it('POSTs /api/v1/profile/:id/verify with no body', async () => {
    const spy = vi.fn(async () => jsonResponse(fullProfileResponse));
    vi.stubGlobal('fetch', spy);

    await verifyProfile('abc');

    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/profile\/abc\/verify$/);
    expect(init.method).toBe('POST');
    expect(init.body).toBeUndefined();
  });
});

describe('deactivateProfile', () => {
  it('POSTs /api/v1/profile/:id/deactivate with no body', async () => {
    const spy = vi.fn(async () => jsonResponse(fullProfileResponse));
    vi.stubGlobal('fetch', spy);

    await deactivateProfile('abc');

    const [url, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toMatch(/\/api\/v1\/profile\/abc\/deactivate$/);
    expect(init.method).toBe('POST');
  });
});
