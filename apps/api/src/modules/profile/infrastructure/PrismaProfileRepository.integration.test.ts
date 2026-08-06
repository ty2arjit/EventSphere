import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaProfileRepository } from './PrismaProfileRepository';
import { User } from '../domain/User';
import { UniqueConstraintViolationError } from '../../../shared/errors/UniqueConstraintViolationError';

/**
 * Runs against a REAL database via DATABASE_URL — requires a live connection.
 *
 * KNOWN LIMITATION: this currently points at the same dev database used by
 * `prisma migrate dev`, not an isolated test database/branch (TECHNICAL_BACKLOG.md
 * BL-003). Every test cleans up the rows it creates, but this is a stopgap.
 */
describe('PrismaProfileRepository (integration)', () => {
  const prisma = new PrismaClient();
  const repository = new PrismaProfileRepository(prisma);
  const createdEmails: string[] = [];

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterEach(async () => {
    if (createdEmails.length > 0) {
      await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
      createdEmails.length = 0;
    }
  });

  it('persists a User (and its default profile/preferences) and finds it by email', async () => {
    const user = User.register('integration-test@example.com', 'Integration Test');
    createdEmails.push(user.email);

    await repository.save(user);

    const found = await repository.findByEmail(user.email);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(user.id);
    expect(found?.name).toBe('Integration Test');
    expect(found?.status).toBe('registered');
    expect(found?.profile.bio).toBeNull();
    expect(found?.preferences.language).toBe('en');
  });

  it('finds a User by id', async () => {
    const user = User.register('integration-findbyid@example.com', 'Find By Id');
    createdEmails.push(user.email);
    await repository.save(user);

    const found = await repository.findById(user.id);
    expect(found?.id).toBe(user.id);
  });

  it('returns null for an email that does not exist', async () => {
    const found = await repository.findByEmail('does-not-exist@example.com');
    expect(found).toBeNull();
  });

  it('throws UniqueConstraintViolationError when saving a duplicate email', async () => {
    const email = 'integration-duplicate@example.com';
    const first = User.register(email, 'First');
    createdEmails.push(email);
    await repository.save(first);

    const second = User.register(email, 'Second');
    await expect(repository.save(second)).rejects.toThrow(UniqueConstraintViolationError);
  });

  it('updateProfile persists bio/headline and does not touch preferences', async () => {
    const user = User.register('integration-updateprofile@example.com', 'Update Profile');
    createdEmails.push(user.email);
    await repository.save(user);

    user.updateProfile({ bio: 'Hello world', headline: 'Engineer' });
    await repository.updateProfile(user);

    const found = await repository.findById(user.id);
    expect(found?.profile.bio).toBe('Hello world');
    expect(found?.profile.headline).toBe('Engineer');
    expect(found?.preferences.language).toBe('en');
  });

  it('updatePreferences persists preference changes', async () => {
    const user = User.register('integration-updateprefs@example.com', 'Update Prefs');
    createdEmails.push(user.email);
    await repository.save(user);

    user.updatePreferences({ theme: 'dark', notifyInApp: false });
    await repository.updatePreferences(user);

    const found = await repository.findById(user.id);
    expect(found?.preferences.theme).toBe('dark');
    expect(found?.preferences.notifyInApp).toBe(false);
  });

  it('updateIdentity persists lifecycle transitions', async () => {
    const user = User.register('integration-identity@example.com', 'Identity');
    createdEmails.push(user.email);
    await repository.save(user);

    user.verifyIdentity();
    await repository.updateIdentity(user);

    const found = await repository.findById(user.id);
    expect(found?.status).toBe('verified');
    expect(found?.verifiedAt).not.toBeNull();
  });
});
