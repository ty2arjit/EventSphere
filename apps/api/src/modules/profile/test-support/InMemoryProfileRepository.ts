import { ProfileRepository } from '../domain/ProfileRepository';
import { User } from '../domain/User';

/**
 * Test double — implements the same ProfileRepository interface the real
 * Prisma implementation does, so Application and API layer tests can run
 * without a real database.
 */
export class InMemoryProfileRepository implements ProfileRepository {
  private readonly usersByEmail = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    return this.usersByEmail.get(email) ?? null;
  }

  async save(user: User): Promise<void> {
    this.usersByEmail.set(user.email, user);
  }
}
