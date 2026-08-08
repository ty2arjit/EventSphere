import type { PrismaClient } from "@prisma/client";
import type { AttendanceRepository } from "../domain/AttendanceRepository";
import { Attendance, type AttendanceStatus } from "../domain/Attendance";

function toDomain(row: {
  id: string;
  enrollmentId: string;
  eventId: string;
  sessionId: string;
  userId: string;
  status: string;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
}): Attendance {
  return new Attendance({
    id: row.id,
    enrollmentId: row.enrollmentId,
    eventId: row.eventId,
    sessionId: row.sessionId,
    userId: row.userId,
    status: row.status as AttendanceStatus,
    checkInAt: row.checkInAt,
    checkOutAt: row.checkOutAt,
    verifiedBy: row.verifiedBy,
    createdAt: row.createdAt,
  });
}

export class PrismaAttendanceRepository implements AttendanceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string) {
    const row = await this.prisma.attendanceRecord.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findBySessionAndUser(sessionId: string, userId: string) {
    const row = await this.prisma.attendanceRecord.findUnique({
      where: { sessionId_userId: { sessionId, userId } },
    });
    return row ? toDomain(row) : null;
  }

  async findByEventId(eventId: string) {
    const rows = await this.prisma.attendanceRecord.findMany({ where: { eventId } });
    return rows.map(toDomain);
  }

  async findBySessionId(sessionId: string) {
    const rows = await this.prisma.attendanceRecord.findMany({ where: { sessionId } });
    return rows.map(toDomain);
  }

  async save(a: Attendance) {
    await this.prisma.attendanceRecord.create({
      data: {
        id: a.id,
        enrollmentId: a.enrollmentId,
        eventId: a.eventId,
        sessionId: a.sessionId,
        userId: a.userId,
        status: a.status,
        checkInAt: a.checkInAt,
        checkOutAt: a.checkOutAt,
        verifiedBy: a.verifiedBy,
      },
    });
  }

  async update(a: Attendance) {
    await this.prisma.attendanceRecord.update({
      where: { id: a.id },
      data: {
        status: a.status,
        checkInAt: a.checkInAt,
        checkOutAt: a.checkOutAt,
        verifiedBy: a.verifiedBy,
      },
    });
  }
}
