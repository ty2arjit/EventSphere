import type { Enrollment } from "./Enrollment";

export interface EnrollmentRepository {
  findById(id: string): Promise<Enrollment | null>;
  findByEventId(eventId: string): Promise<Enrollment[]>;
  findByUserId(userId: string): Promise<Enrollment[]>;
  findByEventAndUser(eventId: string, userId: string): Promise<Enrollment | null>;
  countActiveByRegistrationId(registrationId: string): Promise<number>;
  save(enrollment: Enrollment): Promise<void>;
  update(enrollment: Enrollment): Promise<void>;
}
