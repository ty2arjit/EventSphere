import { WeakPasswordError } from '../errors';

const MIN_LENGTH = 12;
const HAS_LETTER = /[A-Za-z]/;
const HAS_DIGIT = /\d/;

/**
 * A password provided by the user, held only long enough to hash. Never
 * persisted (Ch.20: "Never store plaintext passwords"). Validated at the
 * domain boundary so weak-password rejection is a business decision, not
 * a UI convention (Constitution Article 23).
 *
 * Deliberately does not expose the raw string via a getter with a bland
 * name — callers must reach for `.reveal()`, which is easy to grep for in
 * a security audit.
 */
export class PlaintextPassword {
  private constructor(private readonly _plaintext: string) {}

  static create(raw: string): PlaintextPassword {
    if (raw.length < MIN_LENGTH) {
      throw new WeakPasswordError(`Password must be at least ${MIN_LENGTH} characters`);
    }
    if (!HAS_LETTER.test(raw)) {
      throw new WeakPasswordError('Password must contain at least one letter');
    }
    if (!HAS_DIGIT.test(raw)) {
      throw new WeakPasswordError('Password must contain at least one digit');
    }
    return new PlaintextPassword(raw);
  }

  reveal(): string {
    return this._plaintext;
  }
}
