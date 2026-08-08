import type { Attendance } from "./Attendance";

export interface AttendanceRepository {
  findById(id: string): Promise<Attendance | null>;
  findBySessionAndUser(sessionId: string, userId: string): Promise<Attendance | null>;
  findByEventId(eventId: string): Promise<Attendance[]>;
  findBySessionId(sessionId: string): Promise<Attendance[]>;
  save(attendance: Attendance): Promise<void>;
  update(attendance: Attendance): Promise<void>;
}
