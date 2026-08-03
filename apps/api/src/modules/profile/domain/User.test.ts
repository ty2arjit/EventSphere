import { describe, expect, it } from 'vitest';
import { User } from './User';
import { InvalidEmailError, InvalidNameError } from './errors';

describe('User.register', () => {
  it('creates a valid User for valid input', () => {
    const user = User.register('  Test@Example.com  ', '  Jane Doe  ');

    expect(user.id).toBeTruthy();
    expect(user.email).toBe('test@example.com'); // trimmed + lowercased
    expect(user.name).toBe('Jane Doe'); // trimmed
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('rejects an invalid email', () => {
    expect(() => User.register('not-an-email', 'Jane Doe')).toThrow(InvalidEmailError);
  });

  it('rejects an empty name', () => {
    expect(() => User.register('test@example.com', '   ')).toThrow(InvalidNameError);
  });

  it('assigns a unique id per instance', () => {
    const a = User.register('a@example.com', 'A');
    const b = User.register('b@example.com', 'B');
    expect(a.id).not.toBe(b.id);
  });
});

describe('User.fromPersistence', () => {
  it('reconstructs a User without re-validating (data already trusted from storage)', () => {
    const user = User.fromPersistence({
      id: 'existing-id',
      email: 'stored@example.com',
      name: 'Stored Name',
      createdAt: new Date('2026-01-01'),
    });

    expect(user.id).toBe('existing-id');
    expect(user.email).toBe('stored@example.com');
  });
});
