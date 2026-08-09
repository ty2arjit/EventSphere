import { randomInt } from 'node:crypto';
import { OtpGenerator } from '../domain/services/OtpGenerator';

/**
 * 6-digit numeric code, zero-padded, drawn from a cryptographically
 * secure source. 1e6 possibilities is far too small to resist offline
 * brute force — callers MUST rate-limit the confirm endpoint (this app
 * uses verificationRateLimit) and MUST scope lookups to the specific
 * credential (never a global hash lookup), which is what keeps this
 * safe despite the small keyspace.
 */
export class CryptoOtpGenerator implements OtpGenerator {
  generate(): string {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
  }
}
