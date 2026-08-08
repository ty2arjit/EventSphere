-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "mode" TEXT NOT NULL DEFAULT 'Offline',
    "visibility" TEXT NOT NULL DEFAULT 'Public',
    "venueLocation" TEXT,
    "address" TEXT,
    "city" TEXT,
    "onlineUrl" TEXT,
    "capacityMin" INTEGER,
    "capacityMax" INTEGER,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "state" TEXT NOT NULL DEFAULT 'Draft',
    "requireApproval" BOOLEAN NOT NULL DEFAULT false,
    "allowWaitlist" BOOLEAN NOT NULL DEFAULT true,
    "showAttendeeList" BOOLEAN NOT NULL DEFAULT true,
    "allowGuestRegistration" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_sessions" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "speaker" TEXT,
    "room" TEXT,
    "startAt" TIMESTAMP(3),
    "endAt" TIMESTAMP(3),
    "state" TEXT NOT NULL DEFAULT 'Draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_committees" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "communityId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'Planning',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_committees_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "committee_roles" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "reportsToRoleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "committee_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_assignments" (
    "id" TEXT NOT NULL,
    "committeeId" TEXT NOT NULL,
    "roleId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "removedAt" TIMESTAMP(3),

    CONSTRAINT "role_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registrations" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "approvalStrategy" TEXT NOT NULL DEFAULT 'Automatic',
    "windowOpensAt" TIMESTAMP(3),
    "windowClosesAt" TIMESTAMP(3),
    "maxParticipants" INTEGER,
    "allowWaitlist" BOOLEAN NOT NULL DEFAULT false,
    "isOpen" BOOLEAN NOT NULL DEFAULT false,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "enrollments" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "responses" JSONB NOT NULL DEFAULT '[]',
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enrollments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "attendance_records" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Present',
    "checkInAt" TIMESTAMP(3),
    "checkOutAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "attendance_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "certificates" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "templateId" TEXT,
    "verificationCode" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "revokedReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "certificates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "operational_tasks" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "committeeRoleId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Todo',
    "priority" TEXT NOT NULL DEFAULT 'Medium',
    "dueDate" TIMESTAMP(3),
    "assignments" JSONB NOT NULL DEFAULT '[]',
    "dependsOn" JSONB NOT NULL DEFAULT '[]',
    "checklistItems" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" TEXT NOT NULL,
    "communityId" TEXT,
    "eventId" TEXT,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'Normal',
    "channels" JSONB NOT NULL DEFAULT '[]',
    "publishedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metric_records" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metric_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "events_slug_key" ON "events"("slug");

-- CreateIndex
CREATE INDEX "events_communityId_idx" ON "events"("communityId");

-- CreateIndex
CREATE INDEX "event_sessions_eventId_idx" ON "event_sessions"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "event_committees_eventId_key" ON "event_committees"("eventId");

-- CreateIndex
CREATE INDEX "committee_roles_committeeId_idx" ON "committee_roles"("committeeId");

-- CreateIndex
CREATE UNIQUE INDEX "committee_roles_committeeId_name_key" ON "committee_roles"("committeeId", "name");

-- CreateIndex
CREATE INDEX "role_assignments_committeeId_idx" ON "role_assignments"("committeeId");

-- CreateIndex
CREATE INDEX "role_assignments_roleId_idx" ON "role_assignments"("roleId");

-- CreateIndex
CREATE UNIQUE INDEX "registrations_eventId_key" ON "registrations"("eventId");

-- CreateIndex
CREATE INDEX "enrollments_registrationId_idx" ON "enrollments"("registrationId");

-- CreateIndex
CREATE INDEX "enrollments_eventId_idx" ON "enrollments"("eventId");

-- CreateIndex
CREATE INDEX "enrollments_userId_idx" ON "enrollments"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "enrollments_eventId_userId_key" ON "enrollments"("eventId", "userId");

-- CreateIndex
CREATE INDEX "attendance_records_eventId_idx" ON "attendance_records"("eventId");

-- CreateIndex
CREATE INDEX "attendance_records_enrollmentId_idx" ON "attendance_records"("enrollmentId");

-- CreateIndex
CREATE UNIQUE INDEX "attendance_records_sessionId_userId_key" ON "attendance_records"("sessionId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_verificationCode_key" ON "certificates"("verificationCode");

-- CreateIndex
CREATE INDEX "certificates_eventId_idx" ON "certificates"("eventId");

-- CreateIndex
CREATE INDEX "certificates_userId_idx" ON "certificates"("userId");

-- CreateIndex
CREATE INDEX "certificates_verificationCode_idx" ON "certificates"("verificationCode");

-- CreateIndex
CREATE UNIQUE INDEX "certificates_enrollmentId_key" ON "certificates"("enrollmentId");

-- CreateIndex
CREATE INDEX "operational_tasks_eventId_idx" ON "operational_tasks"("eventId");

-- CreateIndex
CREATE INDEX "operational_tasks_status_idx" ON "operational_tasks"("status");

-- CreateIndex
CREATE INDEX "announcements_communityId_idx" ON "announcements"("communityId");

-- CreateIndex
CREATE INDEX "announcements_eventId_idx" ON "announcements"("eventId");

-- CreateIndex
CREATE INDEX "announcements_authorId_idx" ON "announcements"("authorId");

-- CreateIndex
CREATE INDEX "metric_records_entityId_idx" ON "metric_records"("entityId");

-- CreateIndex
CREATE INDEX "metric_records_type_idx" ON "metric_records"("type");

-- CreateIndex
CREATE INDEX "metric_records_entityId_type_idx" ON "metric_records"("entityId", "type");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_communityId_fkey" FOREIGN KEY ("communityId") REFERENCES "communities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_sessions" ADD CONSTRAINT "event_sessions_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_roles" ADD CONSTRAINT "committee_roles_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "event_committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "committee_roles" ADD CONSTRAINT "committee_roles_reportsToRoleId_fkey" FOREIGN KEY ("reportsToRoleId") REFERENCES "committee_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_committeeId_fkey" FOREIGN KEY ("committeeId") REFERENCES "event_committees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_assignments" ADD CONSTRAINT "role_assignments_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "committee_roles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "registrations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
