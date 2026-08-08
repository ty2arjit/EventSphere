import { describe, expect, it } from 'vitest';
import { EmailAddress, InvalidEmailAddressError } from './EmailAddress';

describe('EmailAddress.create', () => {
  it('trims and lowercases valid input', () => {
    expect(EmailAddress.create('  Test@Example.com  ').value).toBe('test@example.com');
  });

  it('rejects malformed input', () => {
    expect(() => EmailAddress.create('not-an-email')).toThrow(InvalidEmailAddressError);
  });

  it('two EmailAddresses with the same normalized value are equal', () => {
    const a = EmailAddress.create('Test@Example.com');
    const b = EmailAddress.create('test@example.com');
    expect(a.equals(b)).toBe(true);
  });
});
