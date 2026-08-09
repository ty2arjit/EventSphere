import { SignJWT, jwtVerify } from "jose";

/**
 * Signs and verifies the short-lived token embedded in an attendance QR
 * code. Reuses the jose/HS256 pattern already established in
 * JoseJwtService, but with its own issuer/audience — deliberately NOT
 * interchangeable with a login access token, so a leaked/expired login
 * token can't be replayed here and vice versa.
 *
 * The token itself is the security boundary: the enrollment id and user
 * id it carries are only trustworthy because they're signed. A raw QR
 * that just encoded `enrollmentId` in plaintext would let anyone who saw
 * someone else's badge type in a guessed id and get checked in as them.
 */
export interface CheckInTokenClaims {
  enrollmentId: string;
  eventId: string;
  userId: string;
}

const ISSUER = "eventsphere";
const AUDIENCE = "eventsphere-checkin";

export class QrTokenService {
  private readonly secretKey: Uint8Array;

  constructor(secret: string) {
    if (!secret || secret.length < 32) {
      throw new Error("QR token secret must be at least 32 characters.");
    }
    this.secretKey = new TextEncoder().encode(secret);
  }

  async sign(claims: CheckInTokenClaims, ttlSeconds: number): Promise<string> {
    return new SignJWT({ eventId: claims.eventId, userId: claims.userId })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(claims.enrollmentId)
      .setIssuer(ISSUER)
      .setAudience(AUDIENCE)
      .setIssuedAt()
      .setExpirationTime(`${ttlSeconds}s`)
      .sign(this.secretKey);
  }

  async verify(token: string): Promise<CheckInTokenClaims> {
    const { payload } = await jwtVerify(token, this.secretKey, {
      issuer: ISSUER,
      audience: AUDIENCE,
      algorithms: ["HS256"],
    });
    if (
      typeof payload.sub !== "string" ||
      typeof payload.eventId !== "string" ||
      typeof payload.userId !== "string"
    ) {
      throw new Error("Check-in token missing required claims");
    }
    return { enrollmentId: payload.sub, eventId: payload.eventId, userId: payload.userId };
  }
}
