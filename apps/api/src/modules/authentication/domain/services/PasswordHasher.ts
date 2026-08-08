import type { HashedPassword } from '../valueObjects/HashedPassword';
import type { PlaintextPassword } from '../valueObjects/PlaintextPassword';

/**
 * Domain-facing password hashing contract. The aggregate never sees the
 * underlying algorithm — it hands off plaintext to the hasher and receives
 * a fully-formed HashedPassword back. Infrastructure implements this via
 * argon2 (Argon2PasswordHasher).
 */
export interface PasswordHasher {
  hash(plaintext: PlaintextPassword): Promise<HashedPassword>;
  verify(plaintext: PlaintextPassword, hashed: HashedPassword): Promise<boolean>;
}
