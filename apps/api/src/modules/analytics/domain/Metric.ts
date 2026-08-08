import { randomUUID } from "node:crypto";

export type MetricType =
  | "EventCreated"
  | "EventCompleted"
  | "EnrollmentCount"
  | "AttendanceRate"
  | "CertificateIssued"
  | "TaskCompletion"
  | "CommunityGrowth"
  | "AnnouncementReach"
  | "Custom";

export interface MetricProps {
  id: string;
  type: MetricType;
  entityId: string;
  entityType: string;
  value: number;
  metadata: Record<string, unknown>;
  recordedAt: Date;
}

export class Metric {
  readonly id: string;
  readonly type: MetricType;
  readonly entityId: string;
  readonly entityType: string;
  value: number;
  metadata: Record<string, unknown>;
  readonly recordedAt: Date;

  constructor(props: MetricProps) {
    this.id = props.id;
    this.type = props.type;
    this.entityId = props.entityId;
    this.entityType = props.entityType;
    this.value = props.value;
    this.metadata = props.metadata;
    this.recordedAt = props.recordedAt;
  }

  static record(
    type: MetricType,
    entityId: string,
    entityType: string,
    value: number,
    metadata: Record<string, unknown> = {},
  ): Metric {
    return new Metric({
      id: randomUUID(),
      type,
      entityId,
      entityType,
      value,
      metadata,
      recordedAt: new Date(),
    });
  }
}
