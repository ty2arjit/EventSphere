import { randomBytes } from 'node:crypto';
import { RandomTokenGenerator } from '../domain/services/RandomTokenGenerator';

const TOKEN_BYTES = 32;

/**
 * 32 random bytes → 43-char base64url string. 256 bits of entropy is
 * comfortably above the practical guessing limit and short enough to
 * embed in an email URL.
 */
export class CryptoRandomTokenGenerator implements RandomTokenGenerator {
  generate(): string {
    return randomBytes(TOKEN_BYTES).toString('base64url');
  }
}
