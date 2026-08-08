import { randomUUID } from "node:crypto";

export type AttendanceStatus = "Present" | "Absent" | "Late" | "Excused";

export interface AttendanceProps {
  id: string;
  enrollmentId: string;
  eventId: string;
  sessionId: string;
  userId: string;
  status: AttendanceStatus;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  verifiedBy: string | null;
  createdAt: Date;
}

export class Attendance {
  readonly id: string;
  readonly enrollmentId: string;
  readonly eventId: string;
  readonly sessionId: string;
  readonly userId: string;
  status: AttendanceStatus;
  checkInAt: Date | null;
  checkOutAt: Date | null;
  verifiedBy: string | null;
  readonly createdAt: Date;

  constructor(props: AttendanceProps) {
    this.id = props.id;
    this.enrollmentId = props.enrollmentId;
    this.eventId = props.eventId;
    this.sessionId = props.sessionId;
    this.userId = props.userId;
    this.status = props.status;
    this.checkInAt = props.checkInAt;
    this.checkOutAt = props.checkOutAt;
    this.verifiedBy = props.verifiedBy;
    this.createdAt = props.createdAt;
  }

  static checkIn(enrollmentId: string, eventId: string, sessionId: string, userId: string): Attendance {
    return new Attendance({
      id: randomUUID(),
      enrollmentId,
      eventId,
      sessionId,
      userId,
      status: "Present",
      checkInAt: new Date(),
      checkOutAt: null,
      verifiedBy: null,
      createdAt: new Date(),
    });
  }

  checkOut(): void {
    if (!this.checkInAt) throw new Error("Cannot check out without checking in");
    if (this.checkOutAt) throw new Error("Already checked out");
    this.checkOutAt = new Date();
  }

  markLate(): void {
    this.status = "Late";
  }

  verify(verifierId: string): void {
    this.verifiedBy = verifierId;
  }

  markAbsent(): void {
    this.status = "Absent";
    this.checkInAt = null;
    this.checkOutAt = null;
  }

  excuse(): void {
    this.status = "Excused";
  }
}
