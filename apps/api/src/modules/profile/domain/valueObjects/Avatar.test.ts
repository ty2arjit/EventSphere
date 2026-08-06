import { describe, expect, it } from 'vitest';
import { Avatar } from './Avatar';
import { InvalidAvatarUrlError } from '../errors';

describe('Avatar.create', () => {
  it('accepts a well-formed http(s) URL', () => {
    expect(Avatar.create('https://example.com/avatar.png').url).toBe(
      'https://example.com/avatar.png',
    );
  });

  it('treats null, undefined, and empty string as no avatar', () => {
    expect(Avatar.create(null).url).toBeNull();
    expect(Avatar.create(undefined).url).toBeNull();
    expect(Avatar.create('   ').url).toBeNull();
  });

  it('rejects a malformed URL', () => {
    expect(() => Avatar.create('not-a-url')).toThrow(InvalidAvatarUrlError);
  });
});

describe('Avatar.empty', () => {
  it('has a null url', () => {
    expect(Avatar.empty().url).toBeNull();
  });
});
