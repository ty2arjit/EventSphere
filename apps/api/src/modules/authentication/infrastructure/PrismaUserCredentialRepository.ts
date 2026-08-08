import type {
  PrismaClient,
  UserCredential as UserCredentialRecord,
  AuthenticationProvider as ProviderRecord,
  AuthenticationSession as SessionRecord,
  VerificationToken as TokenRecord,
} from '@prisma/client';
import { UserCredential } from '../domain/UserCredential';
import { UserCredentialRepository } from '../domain/UserCredentialRepository';
import {
  VerificationPurpose,
} from '../domain/entities/VerificationToken';
import { ProviderName } from '../domain/entities/AuthenticationProvider';

type Loaded = UserCredentialRecord & {
  providers: ProviderRecord[];
  sessions: SessionRecord[];
  tokens: TokenRecord[];
};

const INCLUDE = { providers: true, sessions: true, tokens: true } as const;

export class PrismaUserCredentialRepository implements UserCredentialRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<UserCredential | null> {
    const record = await this.prisma.userCredential.findUnique({
      where: { id },
      include: INCLUDE,
    });
    return record ? this.toDomain(record) : null;
  }

  async findByEmail(email: string): Promise<UserCredential | null> {
    const record = await this.prisma.userCredential.findUnique({
      where: { email },
      include: INCLUDE,
    });
    return record ? this.toDomain(record) : null;
  }

  async findByRefreshTokenHash(hash: string): Promise<UserCredential | null> {
    const session = await this.prisma.authenticationSession.findUnique({
      where: { refreshTokenHash: hash },
      select: { userCredentialId: true },
    });
    if (!session) return null;
    return this.findById(session.userCredentialId);
  }

  async findByVerificationTokenHash(
    purpose: VerificationPurpose,
    hash: string,
  ): Promise<UserCredential | null> {
    const token = await this.prisma.verificationToken.findUnique({
      where: { tokenHash: hash },
      select: { userCredentialId: true, purpose: true },
    });
    if (!token || token.purpose !== purpose) return null;
    return this.findById(token.userCredentialId);
  }

  /**
   * Registration insert path. Assumes the User row (Profile Domain)
   * already exists — the calling Application Service creates it in the
   * same $transaction that calls this method. The FK from user_credentials
   * to users enforces this at the database level.
   */
  async save(credential: UserCredential): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userCredential.create({
        data: {
          id: credential.id,
          email: credential.email,
          hashedPassword: credential.hashedPassword?.serialize() ?? null,
          emailVerifiedAt: credential.emailVerifiedAt,
          createdAt: credential.createdAt,
          updatedAt: credential.updatedAt,
        },
      }),
      ...credential.providers.map((provider) =>
        this.prisma.authenticationProvider.create({
          data: {
            id: provider.id,
            userCredentialId: provider.userCredentialId,
            provider: provider.provider,
            providerAccountId: provider.providerAccountId,
            linkedAt: provider.linkedAt,
          },
        }),
      ),
    ]);
  }

  async updateCredential(credential: UserCredential): Promise<void> {
    await this.prisma.userCredential.update({
      where: { id: credential.id },
      data: {
        hashedPassword: credential.hashedPassword?.serialize() ?? null,
        emailVerifiedAt: credential.emailVerifiedAt,
        email: credential.email,
        updatedAt: credential.updatedAt,
      },
    });
  }

  /**
   * Reconciles this credential's sessions with the DB. Rather than diffing
   * against the loaded aggregate (fragile), we use `upsert` for each
   * session — sessions are append-only (new inserts) plus revocation
   * (updating revokedAt on existing rows), so `upsert` covers both cases.
   */
  async updateSessions(credential: UserCredential): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userCredential.update({
        where: { id: credential.id },
        data: { updatedAt: credential.updatedAt },
      }),
      ...credential.sessions.map((session) =>
        this.prisma.authenticationSession.upsert({
          where: { id: session.id },
          create: {
            id: session.id,
            userCredentialId: session.userCredentialId,
            refreshTokenHash: session.refreshTokenHash,
            deviceLabel: session.deviceLabel,
            ipAddress: session.ipAddress,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            revokedAt: session.revokedAt,
          },
          update: {
            revokedAt: session.revokedAt,
          },
        }),
      ),
    ]);
  }

  async updateTokens(credential: UserCredential): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userCredential.update({
        where: { id: credential.id },
        data: { updatedAt: credential.updatedAt },
      }),
      ...credential.tokens.map((token) =>
        this.prisma.verificationToken.upsert({
          where: { id: token.id },
          create: {
            id: token.id,
            userCredentialId: token.userCredentialId,
            purpose: token.purpose,
            tokenHash: token.tokenHash,
            createdAt: token.createdAt,
            expiresAt: token.expiresAt,
            consumedAt: token.consumedAt,
          },
          update: {
            consumedAt: token.consumedAt,
          },
        }),
      ),
    ]);
  }

  private toDomain(record: Loaded): UserCredential {
    return UserCredential.fromPersistence({
      id: record.id,
      email: record.email,
      hashedPassword: record.hashedPassword,
      emailVerifiedAt: record.emailVerifiedAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      providers: record.providers.map((p) => ({
        id: p.id,
        userCredentialId: p.userCredentialId,
        provider: p.provider as ProviderName,
        providerAccountId: p.providerAccountId,
        linkedAt: p.linkedAt,
      })),
      sessions: record.sessions.map((s) => ({
        id: s.id,
        userCredentialId: s.userCredentialId,
        refreshTokenHash: s.refreshTokenHash,
        deviceLabel: s.deviceLabel,
        ipAddress: s.ipAddress,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        revokedAt: s.revokedAt,
      })),
      tokens: record.tokens.map((t) => ({
        id: t.id,
        userCredentialId: t.userCredentialId,
        purpose: t.purpose as VerificationPurpose,
        tokenHash: t.tokenHash,
        createdAt: t.createdAt,
        expiresAt: t.expiresAt,
        consumedAt: t.consumedAt,
      })),
    });
  }
}
