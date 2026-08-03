import { User } from './User';

/**
 * Repository interface — Domain layer. Implementation (PrismaProfileRepository)
 * lives in Infrastructure. One repository per aggregate, no generic/base
 * repository abstraction (Constitution Article 26).
 */
export interface ProfileRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
