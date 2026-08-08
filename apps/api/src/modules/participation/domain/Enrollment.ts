import { randomUUID } from "node:crypto";
import type { EnrollmentStatus } from "./valueObjects/EnrollmentStatus";

export interface EnrollmentResponse {
  questionId: string;
  value: string;
}

export interface EnrollmentProps {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  status: EnrollmentStatus;
  responses: EnrollmentResponse[];
  reviewedBy: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class Enrollment {
  readonly id: string;
  readonly registrationId: string;
  readonly eventId: string;
  readonly userId: string;
  status: EnrollmentStatus;
  responses: EnrollmentResponse[];
  reviewedBy: string | null;
  reviewedAt: Date | null;
  readonly createdAt: Date;
  updatedAt: Date;

  constructor(props: EnrollmentProps) {
    this.id = props.id;
    this.registrationId = props.registrationId;
    this.eventId = props.eventId;
    this.userId = props.userId;
    this.status = props.status;
    this.responses = props.responses;
    this.reviewedBy = props.reviewedBy;
    this.reviewedAt = props.reviewedAt;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  static create(
    registrationId: string,
    eventId: string,
    userId: string,
    responses: EnrollmentResponse[],
    autoApprove: boolean = false,
  ): Enrollment {
    return new Enrollment({
      id: randomUUID(),
      registrationId,
      eventId,
      userId,
      status: autoApprove ? "Approved" : "Pending",
      responses,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  approve(reviewerId: string): void {
    if (this.status !== "Pending" && this.status !== "Waitlisted") {
      throw new Error(`Cannot approve enrollment in "${this.status}" status`);
    }
    this.status = "Approved";
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
    this.updatedAt = new Date();
  }

  reject(reviewerId: string): void {
    if (this.status !== "Pending" && this.status !== "Waitlisted") {
      throw new Error(`Cannot reject enrollment in "${this.status}" status`);
    }
    this.status = "Rejected";
    this.reviewedBy = reviewerId;
    this.reviewedAt = new Date();
    this.updatedAt = new Date();
  }

  waitlist(): void {
    if (this.status !== "Pending") {
      throw new Error(`Cannot waitlist enrollment in "${this.status}" status`);
    }
    this.status = "Waitlisted";
    this.updatedAt = new Date();
  }

  cancel(): void {
    if (this.status === "Cancelled" || this.status === "Rejected") {
      throw new Error(`Cannot cancel enrollment in "${this.status}" status`);
    }
    this.status = "Cancelled";
    this.updatedAt = new Date();
  }

  get isActive(): boolean {
    return this.status === "Approved" || this.status === "Pending" || this.status === "Waitlisted";
  }
}
