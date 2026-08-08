import { describe, expect, it } from 'vitest';
import { HashedPassword } from './HashedPassword';

describe('HashedPassword', () => {
  it('serializes with the algorithm prefix', () => {
    const h = HashedPassword.create('argon2id', 'abcdef123');
    expect(h.serialize()).toBe('argon2id$abcdef123');
  });

  it('round-trips through fromPersistence/serialize', () => {
    const h = HashedPassword.fromPersistence('argon2id$long-hash-here');
    expect(h.algorithm).toBe('argon2id');
    expect(h.hash).toBe('long-hash-here');
    expect(h.serialize()).toBe('argon2id$long-hash-here');
  });

  it('rejects a serialized string without a separator', () => {
    expect(() => HashedPassword.fromPersistence('missing-separator')).toThrow();
  });

  it('rejects an unknown algorithm', () => {
    expect(() => HashedPassword.fromPersistence('md5$whatever')).toThrow();
  });

  it('rejects an empty hash', () => {
    expect(() => HashedPassword.fromPersistence('argon2id$')).toThrow();
    expect(() => HashedPassword.create('argon2id', '')).toThrow();
  });
});
