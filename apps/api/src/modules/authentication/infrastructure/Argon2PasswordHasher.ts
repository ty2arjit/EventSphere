import argon2 from 'argon2';
import { HashedPassword } from '../domain/valueObjects/HashedPassword';
import { PlaintextPassword } from '../domain/valueObjects/PlaintextPassword';
import { PasswordHasher } from '../domain/services/PasswordHasher';

/**
 * argon2id — current OWASP recommendation. Parameters chosen to match
 * argon2's OWASP-aligned defaults for interactive login (~50ms on modern
 * hardware); increase memoryCost for stronger stretching if the environment
 * allows.
 */
const ARGON2_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456, // ~19 MB
  timeCost: 2,
  parallelism: 1,
} as const;

export class Argon2PasswordHasher implements PasswordHasher {
  async hash(plaintext: PlaintextPassword): Promise<HashedPassword> {
    const raw = await argon2.hash(plaintext.reveal(), ARGON2_OPTIONS);
    return HashedPassword.create('argon2id', raw);
  }

  async verify(plaintext: PlaintextPassword, hashed: HashedPassword): Promise<boolean> {
    if (hashed.algorithm !== 'argon2id') {
      return false;
    }
    try {
      return await argon2.verify(hashed.hash, plaintext.reveal());
    } catch {
      // argon2 throws on malformed hashes; treat as no match rather than crash.
      return false;
    }
  }
}
