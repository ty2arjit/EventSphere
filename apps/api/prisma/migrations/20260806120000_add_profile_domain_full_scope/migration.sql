-- AlterTable
ALTER TABLE "users" ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'registered',
ADD COLUMN     "verifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_profiles" (
    "userId" TEXT NOT NULL,
    "avatarUrl" TEXT,
    "bio" TEXT,
    "headline" TEXT,
    "institution" TEXT,
    "department" TEXT,
    "graduationYear" INTEGER,

    CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "user_preferences" (
    "userId" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "theme" TEXT NOT NULL DEFAULT 'system',
    "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyInApp" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("userId")
);

-- AddForeignKey
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_preferences" ADD CONSTRAINT "user_preferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill: every pre-existing users row (from the Walking Skeleton) gets a
-- default profile and preferences row, so the domain layer's invariant
-- "a User always has a profile and preferences" holds for every row, old and
-- new, without pushing null-handling into the aggregate.
INSERT INTO "user_profiles" ("userId")
SELECT "id" FROM "users"
ON CONFLICT ("userId") DO NOTHING;

INSERT INTO "user_preferences" ("userId")
SELECT "id" FROM "users"
ON CONFLICT ("userId") DO NOTHING;
