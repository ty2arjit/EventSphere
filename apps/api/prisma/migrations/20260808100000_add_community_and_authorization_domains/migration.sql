-- Community Domain tables

-- CreateTable
CREATE TABLE "communities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "logoUrl" TEXT,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "communities_slug_key" ON "communities"("slug");

-- CreateTable
CREATE TABLE "community_members" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "community_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_members_communityId_userId_key" ON "community_members"("communityId", "userId");

-- CreateIndex
CREATE INDEX "community_members_userId_idx" ON "community_members"("userId");

-- CreateTable
CREATE TABLE "community_positions" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "allowsMultipleHolders" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_positions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "community_positions_communityId_name_key" ON "community_positions"("communityId", "name");

-- CreateTable
CREATE TABLE "position_assignments" (
    "id" TEXT NOT NULL,
    "positionId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "position_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "position_assignments_positionId_idx" ON "position_assignments"("positionId");

-- CreateIndex
CREATE INDEX "position_assignments_memberId_idx" ON "position_assignments"("memberId");

-- CreateTable
CREATE TABLE "community_invitations" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "invitedEmail" TEXT NOT NULL,
    "invitedByUserId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "community_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "community_invitations_communityId_idx" ON "community_invitations"("communityId");

-- CreateTable
CREATE TABLE "community_settings" (
    "communityId" TEXT NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "allowMemberInvitations" BOOLEAN NOT NULL DEFAULT false,
    "invitationExpiryDays" INTEGER NOT NULL DEFAULT 7,
    "defaultMemberRole" TEXT,

    CONSTRAINT "community_settings_pkey" PRIMARY KEY ("communityId")
);

-- AddForeignKey
ALTER TABLE "communities" ADD CONSTRAINT "communities_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_members" ADD CONSTRAINT "community_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_positions" ADD CONSTRAINT "community_positions_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position_assignments" ADD CONSTRAINT "position_assignments_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "community_positions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "position_assignments" ADD CONSTRAINT "position_assignments_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "community_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_invitations" ADD CONSTRAINT "community_invitations_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "community_settings" ADD CONSTRAINT "community_settings_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Authorization Domain tables

-- CreateTable
CREATE TABLE "permissions" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateTable
CREATE TABLE "permission_grants" (
    "id" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "contextLevel" TEXT NOT NULL,
    "contextId" TEXT,
    "responsibilityType" TEXT NOT NULL,
    "responsibilityId" TEXT NOT NULL,
    "grantedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "permission_grants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "permission_grants_permissionId_idx" ON "permission_grants"("permissionId");

-- CreateIndex
CREATE INDEX "permission_grants_responsibilityType_responsibilityId_idx" ON "permission_grants"("responsibilityType", "responsibilityId");

-- AddForeignKey
ALTER TABLE "permission_grants" ADD CONSTRAINT "permission_grants_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
