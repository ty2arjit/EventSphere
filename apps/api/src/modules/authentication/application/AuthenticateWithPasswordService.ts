import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { EmailAddress } from '../domain/valueObjects/EmailAddress';
import { PlaintextPassword } from '../domain/valueObjects/PlaintextPassword';
import { PasswordHasher } from '../domain/services/PasswordHasher';
import { TokenHasher } from '../domain/services/TokenHasher';
import { RandomTokenGenerator } from '../domain/services/RandomTokenGenerator';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { InvalidCredentialsError } from '../domain/errors';
import { JwtService } from '../infrastructure/JoseJwtService';
import { AuthConfig } from './AuthConfig';

export interface AuthenticateWithPasswordInput {
  email: string;
  password: string;
  deviceLabel?: string | null;
  ipAddress?: string | null;
}

export interface AuthenticateWithPasswordResult {
  accessToken: string;
  refreshToken: string;
  sessionId: string;
  emailVerified: boolean;
}

export class AuthenticateWithPasswordService {
  constructor(
    private readonly credentialRepository: UserCredentialRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenHasher: TokenHasher,
    private readonly tokenGenerator: RandomTokenGenerator,
    private readonly jwtService: JwtService,
    private readonly eventPublisher: EventPublisher,
    private readonly config: AuthConfig,
  ) {}

  async execute(input: AuthenticateWithPasswordInput): Promise<AuthenticateWithPasswordResult> {
    // Both branches — "email not found" and "wrong password" — surface
    // the same InvalidCredentialsError so the caller cannot enumerate
    // registered accounts (BL-002).
    let email;
    try {
      email = EmailAddress.create(input.email);
    } catch {
      throw new InvalidCredentialsError();
    }
    let password;
    try {
      password = PlaintextPassword.create(input.password);
    } catch {
      throw new InvalidCredentialsError();
    }

    const credential = await this.credentialRepository.findByEmail(email.value);
    if (!credential) {
      throw new InvalidCredentialsError();
    }
    const ok = await credential.attemptPassword(password, this.passwordHasher);
    if (!ok) {
      throw new InvalidCredentialsError();
    }

    const rawRefresh = this.tokenGenerator.generate();
    const refreshTokenHash = this.tokenHasher.hash(rawRefresh);
    const expiresAt = new Date(Date.now() + this.config.refreshTokenTtlSeconds * 1000);

    const session = credential.startSession(
      refreshTokenHash,
      expiresAt,
      input.deviceLabel ?? null,
      input.ipAddress ?? null,
    );

    await this.credentialRepository.updateSessions(credential);

    for (const event of credential.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }

    const accessToken = await this.jwtService.issueAccessToken(
      {
        sub: credential.id,
        sessionId: session.id,
        emailVerified: credential.emailVerifiedAt !== null,
      },
      this.config.accessTokenTtlSeconds,
    );

    return {
      accessToken,
      refreshToken: rawRefresh,
      sessionId: session.id,
      emailVerified: credential.emailVerifiedAt !== null,
    };
  }
}
