import type { AttendanceRepository } from "../domain/AttendanceRepository";
import type { EventPublisher } from "../../../shared/events/EventPublisher";
import { Attendance } from "../domain/Attendance";
import { createDomainEvent } from "../../../shared/events/DomainEvent";

export class AttendanceService {
  constructor(
    private readonly repo: AttendanceRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async checkIn(enrollmentId: string, eventId: string, sessionId: string, userId: string): Promise<Attendance> {
    const existing = await this.repo.findBySessionAndUser(sessionId, userId);
    if (existing) throw new Error("User already has an attendance record for this session");

    const attendance = Attendance.checkIn(enrollmentId, eventId, sessionId, userId);
    await this.repo.save(attendance);
    await this.publisher.publish(
      createDomainEvent({
        eventType: "AttendanceCheckedIn",
        aggregateId: attendance.id,
        aggregateType: "Attendance",
        payload: { eventId, sessionId, userId },
      }),
    );
    return attendance;
  }

  async checkOut(attendanceId: string): Promise<void> {
    const a = await this.load(attendanceId);
    a.checkOut();
    await this.repo.update(a);
  }

  async verify(attendanceId: string, verifierId: string): Promise<void> {
    const a = await this.load(attendanceId);
    a.verify(verifierId);
    await this.repo.update(a);
  }

  async listBySession(sessionId: string): Promise<Attendance[]> {
    return this.repo.findBySessionId(sessionId);
  }

  async listByEvent(eventId: string): Promise<Attendance[]> {
    return this.repo.findByEventId(eventId);
  }

  private async load(id: string): Promise<Attendance> {
    const a = await this.repo.findById(id);
    if (!a) throw new Error(`Attendance record not found: ${id}`);
    return a;
  }
}
