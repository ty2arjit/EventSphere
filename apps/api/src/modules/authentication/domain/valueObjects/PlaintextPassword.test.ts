import { describe, expect, it } from 'vitest';
import { PlaintextPassword } from './PlaintextPassword';
import { WeakPasswordError } from '../errors';

describe('PlaintextPassword.create', () => {
  it('accepts a strong password', () => {
    const password = PlaintextPassword.create('correcthorse1battery');
    expect(password.reveal()).toBe('correcthorse1battery');
  });

  it('rejects a password shorter than 12 characters', () => {
    expect(() => PlaintextPassword.create('short1abc')).toThrow(WeakPasswordError);
  });

  it('rejects a password with no digit', () => {
    expect(() => PlaintextPassword.create('correcthorsebattery')).toThrow(WeakPasswordError);
  });

  it('rejects a password with no letter', () => {
    expect(() => PlaintextPassword.create('123456789012')).toThrow(WeakPasswordError);
  });
});
