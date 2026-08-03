import { Prisma, PrismaClient } from '@prisma/client';
import { ProfileRepository } from '../domain/ProfileRepository';
import { User } from '../domain/User';
import { UniqueConstraintViolationError } from '../../../shared/errors/UniqueConstraintViolationError';

const PRISMA_UNIQUE_CONSTRAINT_CODE = 'P2002';

export class PrismaProfileRepository implements ProfileRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByEmail(email: string): Promise<User | null> {
    const record = await this.prisma.user.findUnique({ where: { email } });
    if (!record) {
      return null;
    }

    return User.fromPersistence({
      id: record.id,
      email: record.email,
      name: record.name,
      createdAt: record.createdAt,
    });
  }

  async save(user: User): Promise<void> {
    try {
      await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          createdAt: user.createdAt,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === PRISMA_UNIQUE_CONSTRAINT_CODE
      ) {
        throw new UniqueConstraintViolationError('email');
      }
      throw error;
    }
  }
}
