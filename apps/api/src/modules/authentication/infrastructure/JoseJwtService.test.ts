import { describe, expect, it } from 'vitest';
import { JoseJwtService } from './JoseJwtService';

const SECRET = 'a'.repeat(48);

describe('JoseJwtService', () => {
  it('refuses to construct with a short secret', () => {
    expect(() => new JoseJwtService('too-short')).toThrow();
  });

  it('round-trips claims through issue/verify', async () => {
    const svc = new JoseJwtService(SECRET);
    const token = await svc.issueAccessToken(
      { sub: 'user-1', sessionId: 'sess-1', emailVerified: true },
      60,
    );
    const claims = await svc.verifyAccessToken(token);
    expect(claims.sub).toBe('user-1');
    expect(claims.sessionId).toBe('sess-1');
    expect(claims.emailVerified).toBe(true);
  });

  it('rejects a token signed with a different secret', async () => {
    const a = new JoseJwtService(SECRET);
    const b = new JoseJwtService('b'.repeat(48));
    const token = await a.issueAccessToken(
      { sub: 'user-1', sessionId: 'sess-1', emailVerified: false },
      60,
    );
    await expect(b.verifyAccessToken(token)).rejects.toThrow();
  });

  it('rejects an expired token', async () => {
    const svc = new JoseJwtService(SECRET);
    const token = await svc.issueAccessToken(
      { sub: 'user-1', sessionId: 'sess-1', emailVerified: false },
      -1, // already expired
    );
    await expect(svc.verifyAccessToken(token)).rejects.toThrow();
  });
});
