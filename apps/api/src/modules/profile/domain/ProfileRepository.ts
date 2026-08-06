import { User } from './User';

/**
 * Repository interface — Domain layer. Implementation (PrismaProfileRepository)
 * lives in Infrastructure. One repository per aggregate, no generic/base
 * repository abstraction (Constitution Article 26).
 *
 * Write methods are deliberately narrow — save() is the insert-only path
 * (registration), while updateIdentity/updateProfile/updatePreferences each
 * persist only the sub-table(s) the calling Application Service actually
 * changed, rather than one broad update() that would transactionally touch
 * tables unrelated to the use case (mirrors the one-Application-Service-
 * per-use-case discipline, Article 24, at the persistence layer too).
 */
export interface ProfileRepository {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  save(user: User): Promise<void>;
  updateIdentity(user: User): Promise<void>;
  updateProfile(user: User): Promise<void>;
  updatePreferences(user: User): Promise<void>;
}
