import type { PrismaClient } from "@prisma/client";
import type { EnrollmentRepository } from "../domain/EnrollmentRepository";
import { Enrollment, type EnrollmentResponse } from "../domain/Enrollment";
import type { EnrollmentStatus } from "../domain/valueObjects/EnrollmentStatus";

function toDomain(row: {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  status: string;
  responses: unknown;
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): Enrollment {
  return new Enrollment({
    id: row.id,
    registrationId: row.registrationId,
    eventId: row.eventId,
    userId: row.userId,
    status: row.status as EnrollmentStatus,
    responses: (row.responses as EnrollmentResponse[]) ?? [],
    reviewedBy: row.reviewedBy,
    reviewedAt: row.reviewedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

export class PrismaEnrollmentRepository implements EnrollmentRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<Enrollment | null> {
    const row = await this.prisma.enrollment.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEventId(eventId: string): Promise<Enrollment[]> {
    const rows = await this.prisma.enrollment.findMany({ where: { eventId }, orderBy: { createdAt: "desc" } });
    return rows.map(toDomain);
  }

  async findByUserId(userId: string): Promise<Enrollment[]> {
    const rows = await this.prisma.enrollment.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return rows.map(toDomain);
  }

  async findByEventAndUser(eventId: string, userId: string): Promise<Enrollment | null> {
    const row = await this.prisma.enrollment.findUnique({
      where: { eventId_userId: { eventId, userId } },
    });
    return row ? toDomain(row) : null;
  }

  async countActiveByRegistrationId(registrationId: string): Promise<number> {
    return this.prisma.enrollment.count({
      where: {
        registrationId,
        status: { in: ["Approved", "Pending", "Waitlisted"] },
      },
    });
  }

  async save(enrollment: Enrollment): Promise<void> {
    await this.prisma.enrollment.create({
      data: {
        id: enrollment.id,
        registrationId: enrollment.registrationId,
        eventId: enrollment.eventId,
        userId: enrollment.userId,
        status: enrollment.status,
        responses: enrollment.responses as object[],
        reviewedBy: enrollment.reviewedBy,
        reviewedAt: enrollment.reviewedAt,
      },
    });
  }

  async update(enrollment: Enrollment): Promise<void> {
    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        status: enrollment.status,
        reviewedBy: enrollment.reviewedBy,
        reviewedAt: enrollment.reviewedAt,
        updatedAt: enrollment.updatedAt,
      },
    });
  }
}
