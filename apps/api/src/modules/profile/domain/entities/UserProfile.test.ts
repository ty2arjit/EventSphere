import { describe, expect, it } from 'vitest';
import { UserProfile } from './UserProfile';
import { Avatar } from '../valueObjects/Avatar';
import { InvalidProfileFieldError } from '../errors';

describe('UserProfile.createDefault', () => {
  it('starts with all fields null and no avatar', () => {
    const profile = UserProfile.createDefault('user-1');
    expect(profile.userId).toBe('user-1');
    expect(profile.avatar.url).toBeNull();
    expect(profile.bio).toBeNull();
    expect(profile.headline).toBeNull();
    expect(profile.institution).toBeNull();
    expect(profile.department).toBeNull();
    expect(profile.graduationYear).toBeNull();
  });
});

describe('UserProfile.applyPatch', () => {
  it('updates only the fields present in the patch', () => {
    const profile = UserProfile.createDefault('user-1');
    profile.applyPatch({ bio: 'Hello', headline: 'Engineer' });
    expect(profile.bio).toBe('Hello');
    expect(profile.headline).toBe('Engineer');
    expect(profile.institution).toBeNull();
  });

  it('accepts a valid graduation year', () => {
    const profile = UserProfile.createDefault('user-1');
    profile.applyPatch({ graduationYear: 2025 });
    expect(profile.graduationYear).toBe(2025);
  });

  it('rejects an out-of-range graduation year', () => {
    const profile = UserProfile.createDefault('user-1');
    expect(() => profile.applyPatch({ graduationYear: 1900 })).toThrow(InvalidProfileFieldError);
  });

  it('allows clearing a field back to null', () => {
    const profile = UserProfile.createDefault('user-1');
    profile.applyPatch({ bio: 'Hello' });
    profile.applyPatch({ bio: null });
    expect(profile.bio).toBeNull();
  });
});

describe('UserProfile.updateAvatar', () => {
  it('replaces the avatar', () => {
    const profile = UserProfile.createDefault('user-1');
    profile.updateAvatar(Avatar.create('https://example.com/a.png'));
    expect(profile.avatar.url).toBe('https://example.com/a.png');
  });
});
