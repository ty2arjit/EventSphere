import { ProfileRepository } from '../domain/ProfileRepository';
import { User } from '../domain/User';

/**
 * Test double — implements the same ProfileRepository interface the real
 * Prisma implementation does, so Application and API layer tests can run
 * without a real database.
 */
export class InMemoryProfileRepository implements ProfileRepository {
  private readonly usersById = new Map<string, User>();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.usersById.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.usersById.get(id) ?? null;
  }

  async save(user: User): Promise<void> {
    this.usersById.set(user.id, user);
  }

  async updateIdentity(user: User): Promise<void> {
    this.usersById.set(user.id, user);
  }

  async updateProfile(user: User): Promise<void> {
    this.usersById.set(user.id, user);
  }

  async updatePreferences(user: User): Promise<void> {
    this.usersById.set(user.id, user);
  }
}
