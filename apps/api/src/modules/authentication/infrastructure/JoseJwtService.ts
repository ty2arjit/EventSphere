import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

/**
 * Symmetric HS256 access-token signing. The refresh token is NOT a JWT
 * — it's a random opaque token whose hash is looked up in Postgres — so
 * this service only deals with the short-lived access side.
 *
 * The secret is passed at construction time. server.ts loads it from
 * JWT_ACCESS_SECRET and refuses to boot if the variable is missing —
 * failing loudly is better than emitting unverifiable tokens.
 */
export interface AccessTokenClaims {
  sub: string; // userCredentialId
  sessionId: string;
  emailVerified: boolean;
}

export interface JwtService {
  issueAccessToken(claims: AccessTokenClaims, ttlSeconds: number): Promise<string>;
  verifyAccessToken(token: string): Promise<AccessTokenClaims>;
}

const ISSUER = 'eventsphere';
const AUDIENCE = 'eventsphere-web';

export class JoseJwtService implements JwtService {
  private readonly secretKey: Uint8Array;

  constructor(secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error(
        'JWT_ACCESS_SECRET must be at least 32 characters. Generate with `node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'base64url\'))"`.',
      );
    }
    this.secretKey = new TextEncoder().encode(secret);
  }

  async issueAccessToken(claims: AccessTokenClaims, ttlSeconds: number): Promise<string> {
    return new SignJWT({ sessionId: claims.sessionId, emailVerified: claims.emailVerified })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(claims.sub)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${ttlSeconds}s`)
      .sign(this.secretKey);
  }

  async verifyAccessToken(token: string): Promise<AccessTokenClaims> {
    const { payload } = await jwtVerify(token, this.secretKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ['HS256'],
    });
    return this.toClaims(payload);
  }

  private toClaims(payload: JWTPayload): AccessTokenClaims {
    if (typeof payload.sub !== 'string' || typeof payload.sessionId !== 'string') {
      throw new Error('Access token missing required claims');
    }
    return {
      sub: payload.sub,
      sessionId: payload.sessionId,
      emailVerified: payload.emailVerified === true,
    };
  }
}
