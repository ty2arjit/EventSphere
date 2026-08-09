import type { RegistrationRepository } from "../domain/RegistrationRepository";
import type { EnrollmentRepository } from "../domain/EnrollmentRepository";
import type { EventPublisher } from "../../../shared/events/EventPublisher";
import { Enrollment, type EnrollmentResponse } from "../domain/Enrollment";
import {
  RegistrationNotFoundError,
  RegistrationClosedError,
  DuplicateEnrollmentError,
  EnrollmentNotFoundError,
  EnrollmentAccessDeniedError,
} from "../domain/errors";
import {
  enrollmentCreated,
  enrollmentStatusChanged,
} from "../domain/events/ParticipationEvents";

export class EnrollService {
  constructor(
    private readonly registrationRepo: RegistrationRepository,
    private readonly enrollmentRepo: EnrollmentRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async enroll(
    eventId: string,
    userId: string,
    responses: EnrollmentResponse[],
  ): Promise<Enrollment> {
    const registration = await this.registrationRepo.findByEventId(eventId);
    if (!registration) throw new RegistrationNotFoundError(eventId);

    const activeCount = await this.enrollmentRepo.countActiveByRegistrationId(registration.id);
    if (!registration.canAcceptEnrollment(activeCount)) {
      throw new RegistrationClosedError(eventId);
    }

    const existing = await this.enrollmentRepo.findByEventAndUser(eventId, userId);
    if (existing && existing.isActive) throw new DuplicateEnrollmentError(userId, eventId);

    const autoApprove = registration.approvalStrategy === "Automatic";
    const atCapacity = registration.isAtCapacity(activeCount);

    const enrollment = Enrollment.create(registration.id, eventId, userId, responses, autoApprove && !atCapacity);

    if (atCapacity && registration.capacity.allowWaitlist) {
      enrollment.waitlist();
    }

    await this.enrollmentRepo.save(enrollment);
    await this.publisher.publish(enrollmentCreated(enrollment.id, eventId, userId, enrollment.status));
    return enrollment;
  }

  async approve(enrollmentId: string, reviewerId: string): Promise<void> {
    const enrollment = await this.loadEnrollment(enrollmentId);
    const fromStatus = enrollment.status;
    enrollment.approve(reviewerId);
    await this.enrollmentRepo.update(enrollment);
    await this.publisher.publish(enrollmentStatusChanged(enrollmentId, fromStatus, enrollment.status));
  }

  async reject(enrollmentId: string, reviewerId: string): Promise<void> {
    const enrollment = await this.loadEnrollment(enrollmentId);
    const fromStatus = enrollment.status;
    enrollment.reject(reviewerId);
    await this.enrollmentRepo.update(enrollment);
    await this.publisher.publish(enrollmentStatusChanged(enrollmentId, fromStatus, enrollment.status));
  }

  /**
   * Self-service — deliberately not gated by requireResourcePermission
   * (see participation.routes.ts), since cancelling is the enrollee's own
   * action, not an organizer one. That makes ownership the only thing
   * standing between "cancel my own enrollment" and "cancel anyone's
   * enrollment by guessing its id" — enforce it here.
   */
  async cancel(enrollmentId: string, callerId: string): Promise<void> {
    const enrollment = await this.loadEnrollment(enrollmentId);
    if (enrollment.userId !== callerId) throw new EnrollmentAccessDeniedError();
    const fromStatus = enrollment.status;
    enrollment.cancel();
    await this.enrollmentRepo.update(enrollment);
    await this.publisher.publish(enrollmentStatusChanged(enrollmentId, fromStatus, enrollment.status));
  }

  async listByEvent(eventId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.findByEventId(eventId);
  }

  async listByUser(userId: string): Promise<Enrollment[]> {
    return this.enrollmentRepo.findByUserId(userId);
  }

  private async loadEnrollment(id: string): Promise<Enrollment> {
    const enrollment = await this.enrollmentRepo.findById(id);
    if (!enrollment) throw new EnrollmentNotFoundError(id);
    return enrollment;
  }
}
