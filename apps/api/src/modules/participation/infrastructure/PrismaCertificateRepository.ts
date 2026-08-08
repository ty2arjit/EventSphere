import type { PrismaClient } from "@prisma/client";
import type { CertificateRepository } from "../domain/CertificateRepository";
import { Certificate, type CertificateStatus } from "../domain/Certificate";

function toDomain(row: {
  id: string;
  enrollmentId: string;
  eventId: string;
  userId: string;
  status: string;
  templateId: string | null;
  verificationCode: string;
  issuedAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
  createdAt: Date;
}): Certificate {
  return new Certificate({
    id: row.id,
    enrollmentId: row.enrollmentId,
    eventId: row.eventId,
    userId: row.userId,
    status: row.status as CertificateStatus,
    templateId: row.templateId,
    verificationCode: row.verificationCode,
    issuedAt: row.issuedAt,
    revokedAt: row.revokedAt,
    revokedReason: row.revokedReason,
    createdAt: row.createdAt,
  });
}

export class PrismaCertificateRepository implements CertificateRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string) {
    const row = await this.prisma.certificateRecord.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEnrollmentId(enrollmentId: string) {
    const row = await this.prisma.certificateRecord.findUnique({ where: { enrollmentId } });
    return row ? toDomain(row) : null;
  }

  async findByEventId(eventId: string) {
    const rows = await this.prisma.certificateRecord.findMany({ where: { eventId } });
    return rows.map(toDomain);
  }

  async findByVerificationCode(code: string) {
    const row = await this.prisma.certificateRecord.findUnique({ where: { verificationCode: code } });
    return row ? toDomain(row) : null;
  }

  async save(c: Certificate) {
    await this.prisma.certificateRecord.create({
      data: {
        id: c.id,
        enrollmentId: c.enrollmentId,
        eventId: c.eventId,
        userId: c.userId,
        status: c.status,
        templateId: c.templateId,
        verificationCode: c.verificationCode,
        issuedAt: c.issuedAt,
        revokedAt: c.revokedAt,
        revokedReason: c.revokedReason,
      },
    });
  }

  async update(c: Certificate) {
    await this.prisma.certificateRecord.update({
      where: { id: c.id },
      data: {
        status: c.status,
        templateId: c.templateId,
        issuedAt: c.issuedAt,
        revokedAt: c.revokedAt,
        revokedReason: c.revokedReason,
      },
    });
  }
}
