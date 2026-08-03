import { PrismaClient } from '@prisma/client';

/**
 * Single shared Prisma client instance. Only repository implementations
 * (Infrastructure layer) are permitted to import this — Controllers and
 * Application Services must never call Prisma directly (Constitution
 * Articles 16, 21, 22).
 */
export const prisma = new PrismaClient();
