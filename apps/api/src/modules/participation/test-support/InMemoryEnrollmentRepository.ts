import type { EnrollmentRepository } from "../domain/EnrollmentRepository";
import type { Enrollment } from "../domain/Enrollment";

export class InMemoryEnrollmentRepository implements EnrollmentRepository {
  private enrollments: Enrollment[] = [];

  async findById(id: string): Promise<Enrollment | null> {
    return this.enrollments.find((e) => e.id === id) ?? null;
  }

  async findByEventId(eventId: string): Promise<Enrollment[]> {
    return this.enrollments.filter((e) => e.eventId === eventId);
  }

  async findByUserId(userId: string): Promise<Enrollment[]> {
    return this.enrollments.filter((e) => e.userId === userId);
  }

  async findByEventAndUser(eventId: string, userId: string): Promise<Enrollment | null> {
    return this.enrollments.find((e) => e.eventId === eventId && e.userId === userId) ?? null;
  }

  async countActiveByRegistrationId(registrationId: string): Promise<number> {
    return this.enrollments.filter(
      (e) => e.registrationId === registrationId && e.isActive,
    ).length;
  }

  async save(enrollment: Enrollment): Promise<void> {
    this.enrollments.push(enrollment);
  }

  async update(enrollment: Enrollment): Promise<void> {
    const idx = this.enrollments.findIndex((e) => e.id === enrollment.id);
    if (idx !== -1) this.enrollments[idx] = enrollment;
  }
}
