import { describe, expect, it } from 'vitest';
import { User } from './User';
import {
  InvalidEmailError,
  InvalidNameError,
  AlreadyVerifiedError,
  InvalidLifecycleTransitionError,
} from './errors';

function persistenceProps(overrides: Partial<Parameters<typeof User.fromPersistence>[0]> = {}) {
  return {
    id: 'existing-id',
    email: 'stored@example.com',
    name: 'Stored Name',
    status: 'registered' as const,
    verifiedAt: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    profile: {
      avatarUrl: null,
      bio: null,
      headline: null,
      institution: null,
      department: null,
      graduationYear: null,
    },
    preferences: {
      language: 'en',
      timezone: 'UTC',
      theme: 'system' as const,
      notifyByEmail: true,
      notifyInApp: true,
    },
    ...overrides,
  };
}

describe('User.register', () => {
  it('creates a valid User with default profile and preferences', () => {
    const user = User.register('  Test@Example.com  ', '  Jane Doe  ');

    expect(user.id).toBeTruthy();
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Jane Doe');
    expect(user.status).toBe('registered');
    expect(user.verifiedAt).toBeNull();
    expect(user.createdAt).toBeInstanceOf(Date);
    expect(user.updatedAt).toEqual(user.createdAt);
    expect(user.profile.userId).toBe(user.id);
    expect(user.profile.bio).toBeNull();
    expect(user.preferences.userId).toBe(user.id);
    expect(user.preferences.language).toBe('en');
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

  it('records a ProfileRegistered event', () => {
    const user = User.register('a@example.com', 'A');
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('ProfileRegistered');
  });
});

describe('User.fromPersistence', () => {
  it('reconstructs a User without re-validating and without events', () => {
    const user = User.fromPersistence(persistenceProps());

    expect(user.id).toBe('existing-id');
    expect(user.email).toBe('stored@example.com');
    expect(user.pullDomainEvents()).toHaveLength(0);
  });
});

describe('User.updateProfile', () => {
  it('updates fields and records one ProfileUpdated event', () => {
    const user = User.register('a@example.com', 'A');
    user.pullDomainEvents();

    user.updateProfile({ bio: 'Hello', headline: 'Engineer' });

    expect(user.profile.bio).toBe('Hello');
    expect(user.profile.headline).toBe('Engineer');
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('ProfileUpdated');
  });
});

describe('User.updateAvatar', () => {
  it('updates the avatar and records AvatarChanged', () => {
    const user = User.register('a@example.com', 'A');
    user.pullDomainEvents();

    user.updateAvatar('https://example.com/a.png');

    expect(user.profile.avatar.url).toBe('https://example.com/a.png');
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('AvatarChanged');
  });
});

describe('User.updatePreferences', () => {
  it('updates preferences and records PreferencesUpdated', () => {
    const user = User.register('a@example.com', 'A');
    user.pullDomainEvents();

    user.updatePreferences({ theme: 'dark' });

    expect(user.preferences.theme).toBe('dark');
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('PreferencesUpdated');
  });
});

describe('User.verifyIdentity', () => {
  it('moves registered -> verified and records ProfileVerified', () => {
    const user = User.register('a@example.com', 'A');
    user.pullDomainEvents();

    user.verifyIdentity();

    expect(user.status).toBe('verified');
    expect(user.verifiedAt).toBeInstanceOf(Date);
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('ProfileVerified');
  });

  it('rejects verifying twice', () => {
    const user = User.register('a@example.com', 'A');
    user.verifyIdentity();
    expect(() => user.verifyIdentity()).toThrow(AlreadyVerifiedError);
  });
});

describe('User lifecycle transitions', () => {
  it('activate: verified -> active', () => {
    const user = User.register('a@example.com', 'A');
    user.verifyIdentity();
    user.activate();
    expect(user.status).toBe('active');
  });

  it('activate: rejects from registered', () => {
    const user = User.register('a@example.com', 'A');
    expect(() => user.activate()).toThrow(InvalidLifecycleTransitionError);
  });

  it('deactivate: active -> inactive, records ProfileDeactivated', () => {
    const user = User.register('a@example.com', 'A');
    user.verifyIdentity();
    user.activate();
    user.pullDomainEvents();

    user.deactivate();

    expect(user.status).toBe('inactive');
    const events = user.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]!.eventType).toBe('ProfileDeactivated');
  });

  it('deactivate: rejects double-deactivation', () => {
    const user = User.register('a@example.com', 'A');
    user.verifyIdentity();
    user.activate();
    user.deactivate();
    expect(() => user.deactivate()).toThrow(InvalidLifecycleTransitionError);
  });

  it('activate: reactivates from inactive', () => {
    const user = User.register('a@example.com', 'A');
    user.verifyIdentity();
    user.activate();
    user.deactivate();
    user.activate();
    expect(user.status).toBe('active');
  });

  it('archive: inactive -> archived, no event published', () => {
    const user = User.register('a@example.com', 'A');
    user.verifyIdentity();
    user.activate();
    user.deactivate();
    user.pullDomainEvents();

    user.archive();

    expect(user.status).toBe('archived');
    expect(user.pullDomainEvents()).toHaveLength(0);
  });

  it('archive: rejects from a non-inactive state', () => {
    const user = User.register('a@example.com', 'A');
    expect(() => user.archive()).toThrow(InvalidLifecycleTransitionError);
  });
});
