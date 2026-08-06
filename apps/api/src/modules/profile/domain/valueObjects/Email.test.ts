import { describe, expect, it } from 'vitest';
import { Email } from './Email';
import { InvalidEmailError } from '../errors';

describe('Email.create', () => {
  it('trims and lowercases valid input', () => {
    const email = Email.create('  Test@Example.com  ');
    expect(email.value).toBe('test@example.com');
  });

  it('rejects malformed input', () => {
    expect(() => Email.create('not-an-email')).toThrow(InvalidEmailError);
  });

  it('two Emails with the same normalized value are equal', () => {
    const a = Email.create('Test@Example.com');
    const b = Email.create('test@example.com');
    expect(a.equals(b)).toBe(true);
  });
});
