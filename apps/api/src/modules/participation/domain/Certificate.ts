import { randomUUID } from "node:crypto";

export type CertificateStatus = "Pending" | "Issued" | "Revoked";

export interface CertificateProps {
  id: string;
  enrollmentId: string;
  eventId: string;
  userId: string;
  status: CertificateStatus;
  templateId: string | null;
  verificationCode: string;
  issuedAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
  createdAt: Date;
}

export class Certificate {
  readonly id: string;
  readonly enrollmentId: string;
  readonly eventId: string;
  readonly userId: string;
  status: CertificateStatus;
  templateId: string | null;
  readonly verificationCode: string;
  issuedAt: Date | null;
  revokedAt: Date | null;
  revokedReason: string | null;
  readonly createdAt: Date;

  constructor(props: CertificateProps) {
    this.id = props.id;
    this.enrollmentId = props.enrollmentId;
    this.eventId = props.eventId;
    this.userId = props.userId;
    this.status = props.status;
    this.templateId = props.templateId;
    this.verificationCode = props.verificationCode;
    this.issuedAt = props.issuedAt;
    this.revokedAt = props.revokedAt;
    this.revokedReason = props.revokedReason;
    this.createdAt = props.createdAt;
  }

  static create(enrollmentId: string, eventId: string, userId: string): Certificate {
    return new Certificate({
      id: randomUUID(),
      enrollmentId,
      eventId,
      userId,
      status: "Pending",
      templateId: null,
      verificationCode: randomUUID().replace(/-/g, "").substring(0, 12).toUpperCase(),
      issuedAt: null,
      revokedAt: null,
      revokedReason: null,
      createdAt: new Date(),
    });
  }

  issue(): void {
    if (this.status !== "Pending") throw new Error(`Cannot issue certificate in "${this.status}" status`);
    this.status = "Issued";
    this.issuedAt = new Date();
  }

  revoke(reason: string): void {
    if (this.status !== "Issued") throw new Error(`Cannot revoke certificate in "${this.status}" status`);
    this.status = "Revoked";
    this.revokedAt = new Date();
    this.revokedReason = reason;
  }

  setTemplate(templateId: string): void {
    if (this.status !== "Pending") throw new Error("Cannot change template after issuance");
    this.templateId = templateId;
  }
}
