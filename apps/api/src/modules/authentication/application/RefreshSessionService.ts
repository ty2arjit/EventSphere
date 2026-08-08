import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { TokenHasher } from '../domain/services/TokenHasher';
import { RandomTokenGenerator } from '../domain/services/RandomTokenGenerator';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { InvalidCredentialsError } from '../domain/errors';
import { JwtService } from '../infrastructure/JoseJwtService';
import { AuthConfig } from './AuthConfig';

export interface RefreshSessionResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  emailVerified: boolean;
}

/**
 * Rotates a refresh token: consumes the presented one, issues a new
 * refresh + a new access. If a REVOKED refresh token is presented (i.e.
 * a token that was already rotated), all sessions for that credential
 * are revoked — the token was almost certainly stolen and this is our
 * theft-detection path.
 */
export class RefreshSessionService {
  constructor(
    private readonly credentialRepository: UserCredentialRepository,
    private readonly tokenHasher: TokenHasher,
    private readonly tokenGenerator: RandomTokenGenerator,
    private readonly jwtService: JwtService,
    private readonly eventPublisher: EventPublisher,
    private readonly config: AuthConfig,
  ) {}

  async execute(rawRefreshToken: string): Promise<RefreshSessionResult> {
    const tokenHash = this.tokenHasher.hash(rawRefreshToken);
    const credential = await this.credentialRepository.findByRefreshTokenHash(tokenHash);
    if (!credential) {
      throw new InvalidCredentialsError();
    }

    // Look up the session by hash. If it's revoked, treat as theft and
    // revoke everything. If it's active, rotate normally.
    const session = credential.sessions.find((s) => s.refreshTokenHash === tokenHash);
    if (!session) {
      // Should not happen: findByRefreshTokenHash succeeded but the
      // session isn't on the aggregate. Treat as invalid.
      throw new InvalidCredentialsError();
    }
    if (session.revokedAt !== null) {
      credential.revokeAllForTokenReuse();
      await this.credentialRepository.updateSessions(credential);
      for (const event of credential.pullDomainEvents()) {
        await this.eventPublisher.publish(event);
      }
      throw new InvalidCredentialsError();
    }

    const newRawRefresh = this.tokenGenerator.generate();
    const newRefreshHash = this.tokenHasher.hash(newRawRefresh);
    const expiresAt = new Date(Date.now() + this.config.refreshTokenTtlSeconds * 1000);
    const newSession = credential.rotateSession(session.id, newRefreshHash, expiresAt);

    await this.credentialRepository.updateSessions(credential);
    for (const event of credential.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }

    const accessToken = await this.jwtService.issueAccessToken(
      {
        sub: credential.id,
        sessionId: newSession.id,
        emailVerified: credential.emailVerifiedAt !== null,
      },
      this.config.accessTokenTtlSeconds,
    );

    return {
      accessToken,
      refreshToken: newRawRefresh,
      sessionId: newSession.id,
      emailVerified: credential.emailVerifiedAt !== null,
    };
  }
}
