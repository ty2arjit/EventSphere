import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import { UserCredential } from '../domain/UserCredential';
import { EmailAddress } from '../domain/valueObjects/EmailAddress';
import { PlaintextPassword } from '../domain/valueObjects/PlaintextPassword';
import { PasswordHasher } from '../domain/services/PasswordHasher';
import { TokenHasher } from '../domain/services/TokenHasher';
import { RandomTokenGenerator } from '../domain/services/RandomTokenGenerator';
import { OtpGenerator } from '../domain/services/OtpGenerator';
import { EventPublisher } from '../../../shared/events/EventPublisher';
import { Mailer } from '../infrastructure/Mailer';
import { AuthConfig } from './AuthConfig';
import { ProfileGateway } from './ProfileGateway';

export interface RegisterCredentialInput {
  email: string;
  name: string;
  password: string;
}

/**
 * Full registration flow. Returns nothing outward — the API layer just
 * says "check your email" regardless of whether the address was new.
 *
 * Registration for an already-registered email is a no-op internally:
 * no new credential is created and no verification email is sent to
 * the enumerator. But we still respond with the same generic message,
 * so an attacker can't tell either way (BL-002).
 */
export class RegisterCredentialService {
  constructor(
    private readonly credentialRepository: UserCredentialRepository,
    private readonly profileGateway: ProfileGateway,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenHasher: TokenHasher,
    private readonly tokenGenerator: RandomTokenGenerator,
    private readonly otpGenerator: OtpGenerator,
    private readonly eventPublisher: EventPublisher,
    private readonly mailer: Mailer,
    private readonly config: AuthConfig,
  ) {}

  async execute(input: RegisterCredentialInput): Promise<void> {
    const email = EmailAddress.create(input.email);
    const password = PlaintextPassword.create(input.password);

    // Enumeration guard: bail silently if this email is already registered
    // (either at the credential or profile level). The rest of the flow
    // never runs; the caller sees the same generic response.
    const existingCredential = await this.credentialRepository.findByEmail(email.value);
    if (existingCredential) {
      return;
    }
    const existingProfileId = await this.profileGateway.findUserIdByEmail(email.value);
    if (existingProfileId) {
      // Profile exists but never got a credential — rare edge case (data
      // was seeded, or an OAuth-only account is being upgraded). We do
      // not silently attach a password to it here; that requires a proper
      // account-linking flow. Bail with the generic response.
      return;
    }

    // Create the Profile-side User first (it owns identity), then the
    // credential. If credential save fails, we're left with an orphan
    // Profile row — acceptable because the user can retry registration
    // with the same email and hit the credential-attach path, which is
    // Phase 0's account-linking gap tracked in TECHNICAL_BACKLOG.
    const { userId } = await this.profileGateway.createProfile({
      email: email.value,
      name: input.name,
    });

    const hashedPassword = await this.passwordHasher.hash(password);
    const credential = UserCredential.register(userId, email, hashedPassword);

    // Issue two independent verification artifacts for the same purpose —
    // a link (raw token embedded in a URL) and a 6-digit OTP — so the user
    // can use whichever is more convenient. Consuming either satisfies
    // verification; UserCredential.verifyEmail() guards against a second
    // call, so a stale second artifact just 409s harmlessly if used later.
    const rawToken = this.tokenGenerator.generate();
    const tokenHash = this.tokenHasher.hash(rawToken);
    const expiresAt = new Date(Date.now() + this.config.emailVerificationTtlSeconds * 1000);
    credential.issueVerificationToken('email_verification', tokenHash, expiresAt);

    const otp = this.otpGenerator.generate();
    const otpHash = this.tokenHasher.hash(otp);
    credential.issueVerificationToken('email_verification', otpHash, expiresAt);

    await this.credentialRepository.save(credential);
    await this.credentialRepository.updateTokens(credential);

    for (const event of credential.pullDomainEvents()) {
      await this.eventPublisher.publish(event);
    }

    await this.mailer.sendVerificationEmail(
      email.value,
      `${this.config.webBaseUrl}/email/verify/${rawToken}`,
    );
    await this.mailer.sendVerificationOtp(email.value, otp);
  }
}
