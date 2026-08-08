-- CreateTable
CREATE TABLE "user_credentials" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "hashedPassword" TEXT,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_credentials_email_key" ON "user_credentials"("email");

-- CreateTable
CREATE TABLE "authentication_providers" (
    "id" TEXT NOT NULL,
    "userCredentialId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "linkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authentication_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authentication_providers_provider_providerAccountId_key" ON "authentication_providers"("provider", "providerAccountId");

-- CreateIndex
CREATE INDEX "authentication_providers_userCredentialId_idx" ON "authentication_providers"("userCredentialId");

-- CreateTable
CREATE TABLE "authentication_sessions" (
    "id" TEXT NOT NULL,
    "userCredentialId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "deviceLabel" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "authentication_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authentication_sessions_refreshTokenHash_key" ON "authentication_sessions"("refreshTokenHash");

-- CreateIndex
CREATE INDEX "authentication_sessions_userCredentialId_idx" ON "authentication_sessions"("userCredentialId");

-- CreateTable
CREATE TABLE "verification_tokens" (
    "id" TEXT NOT NULL,
    "userCredentialId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_tokenHash_key" ON "verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "verification_tokens_userCredentialId_purpose_idx" ON "verification_tokens"("userCredentialId", "purpose");

-- AddForeignKey
ALTER TABLE "user_credentials" ADD CONSTRAINT "user_credentials_id_fkey" FOREIGN KEY ("id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication_providers" ADD CONSTRAINT "authentication_providers_userCredentialId_fkey" FOREIGN KEY ("userCredentialId") REFERENCES "user_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "authentication_sessions" ADD CONSTRAINT "authentication_sessions_userCredentialId_fkey" FOREIGN KEY ("userCredentialId") REFERENCES "user_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userCredentialId_fkey" FOREIGN KEY ("userCredentialId") REFERENCES "user_credentials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every existing users row (from Walking Skeleton or Profile
-- Phase 0) gets a user_credentials row with no password and no verified
-- email. Existing users must go through password reset to gain a
-- password — they cannot log in until they do. Acceptable because at
-- migration time production has exactly one Walking-Skeleton-era row.
INSERT INTO "user_credentials" ("id", "email", "hashedPassword", "emailVerifiedAt", "createdAt", "updatedAt")
SELECT "id", "email", NULL, "verifiedAt", "createdAt", "updatedAt" FROM "users"
ON CONFLICT ("id") DO NOTHING;
