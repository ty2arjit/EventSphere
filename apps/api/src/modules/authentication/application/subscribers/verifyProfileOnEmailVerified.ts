import { DomainEvent } from '../../../../shared/events/DomainEvent';
import { EmailVerifiedPayload } from '../../domain/events/EmailVerified';
import { VerifyIdentityService } from '../../../profile/application/VerifyIdentityService';
import { AlreadyVerifiedError } from '../../../profile/domain/errors';
import { logger } from '../../../../shared/logger';

/**
 * Cross-context integration point (Constitution Article 12 — allowed via
 * events). When Authentication publishes EmailVerified, Profile Domain's
 * VerifyIdentityService is invoked so Profile's User.verifiedAt is
 * brought in line with UserCredential.emailVerifiedAt.
 *
 * Authentication never imports ProfileRepository or User; the wiring is
 * done at the composition root (server.ts) which passes an already-
 * constructed VerifyIdentityService instance into this factory.
 */
export function makeVerifyProfileOnEmailVerified(verifyIdentityService: VerifyIdentityService) {
  return async function verifyProfileOnEmailVerified(event: DomainEvent): Promise<void> {
    const payload = event.payload as EmailVerifiedPayload;
    try {
      await verifyIdentityService.execute(payload.userCredentialId);
    } catch (err) {
      // AlreadyVerifiedError is expected in one scenario: the migration
      // backfilled a credential whose Profile was verifiedAt from the
      // Walking Skeleton, and this event fires later. It's a no-op, not
      // an error. Anything else genuinely worth logging.
      if (err instanceof AlreadyVerifiedError) {
        return;
      }
      logger.error(
        { err, userCredentialId: payload.userCredentialId },
        'Failed to sync Profile.verifiedAt after EmailVerified',
      );
      throw err;
    }
  };
}
