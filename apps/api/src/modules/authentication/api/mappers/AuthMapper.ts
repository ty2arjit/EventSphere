import { UserCredential } from '../../domain/UserCredential';
import { AuthenticatedUserResponseDto } from '../dto/AuthenticatedUserResponseDto';

/**
 * The only place a UserCredential aggregate becomes a transport-shaped
 * response. Deliberately does NOT surface the hashed password, active
 * session hashes, or outstanding token hashes — Ch.20 "Never expose
 * credential data outside this domain."
 */
export class AuthMapper {
  static toAuthenticatedUserDto(credential: UserCredential): AuthenticatedUserResponseDto {
    return {
      id: credential.id,
      email: credential.email,
      emailVerified: credential.emailVerifiedAt !== null,
      providers: credential.providers.map((p) => ({
        provider: p.provider,
        linkedAt: p.linkedAt.toISOString(),
      })),
    };
  }
}
