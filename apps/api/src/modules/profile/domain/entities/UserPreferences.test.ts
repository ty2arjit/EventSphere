import { describe, expect, it } from 'vitest';
import { UserPreferences } from './UserPreferences';
import { InvalidPreferencesError } from '../errors';

describe('UserPreferences.createDefault', () => {
  it('has sensible defaults', () => {
    const prefs = UserPreferences.createDefault('user-1');
    expect(prefs.language).toBe('en');
    expect(prefs.timezone).toBe('UTC');
    expect(prefs.theme).toBe('system');
    expect(prefs.notifyByEmail).toBe(true);
    expect(prefs.notifyInApp).toBe(true);
  });
});

describe('UserPreferences.applyPatch', () => {
  it('updates only the fields present in the patch', () => {
    const prefs = UserPreferences.createDefault('user-1');
    prefs.applyPatch({ theme: 'dark', notifyInApp: false });
    expect(prefs.theme).toBe('dark');
    expect(prefs.notifyInApp).toBe(false);
    expect(prefs.language).toBe('en');
  });

  it('rejects an invalid theme', () => {
    const prefs = UserPreferences.createDefault('user-1');
    expect(() => prefs.applyPatch({ theme: 'neon' as never })).toThrow(InvalidPreferencesError);
  });

  it('rejects an empty language or timezone', () => {
    const prefs = UserPreferences.createDefault('user-1');
    expect(() => prefs.applyPatch({ language: '   ' })).toThrow(InvalidPreferencesError);
    expect(() => prefs.applyPatch({ timezone: '   ' })).toThrow(InvalidPreferencesError);
  });
});
