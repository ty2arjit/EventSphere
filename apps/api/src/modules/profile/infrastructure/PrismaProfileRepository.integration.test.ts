import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { PrismaProfileRepository } from './PrismaProfileRepository';
import { User } from '../domain/User';
import { UniqueConstraintViolationError } from '../../../shared/errors/UniqueConstraintViolationError';

/**
 * Runs against a REAL database via DATABASE_URL — requires a live connection.
 *
 * KNOWN LIMITATION: this currently points at the same dev database used by
 * `prisma migrate dev`, not an isolated test database/branch. Every test
 * cleans up the rows it creates, but this is a stopgap, not the recommended
 * setup from the Walking Skeleton blueprint (Section 14), which calls for a
 * separate Neon branch. Set one up before Phase 0 begins in earnest.
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

  it('persists a User and finds it by email', async () => {
    const user = User.register('integration-test@example.com', 'Integration Test');
    createdEmails.push(user.email);

    await repository.save(user);

    const found = await repository.findByEmail(user.email);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(user.id);
    expect(found?.name).toBe('Integration Test');
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
});
