import type { CertificateRepository } from "../domain/CertificateRepository";
import type { EventPublisher } from "../../../shared/events/EventPublisher";
import { Certificate } from "../domain/Certificate";
import { createDomainEvent } from "../../../shared/events/DomainEvent";

export class CertificateService {
  constructor(
    private readonly repo: CertificateRepository,
    private readonly publisher: EventPublisher,
  ) {}

  async create(enrollmentId: string, eventId: string, userId: string): Promise<Certificate> {
    const existing = await this.repo.findByEnrollmentId(enrollmentId);
    if (existing) throw new Error("Certificate already exists for this enrollment");

    const cert = Certificate.create(enrollmentId, eventId, userId);
    await this.repo.save(cert);
    return cert;
  }

  async issue(certId: string): Promise<void> {
    const cert = await this.load(certId);
    cert.issue();
    await this.repo.update(cert);
    await this.publisher.publish(
      createDomainEvent({
        eventType: "CertificateIssued",
        aggregateId: cert.id,
        aggregateType: "Certificate",
        payload: { eventId: cert.eventId, userId: cert.userId, verificationCode: cert.verificationCode },
      }),
    );
  }

  async revoke(certId: string, reason: string): Promise<void> {
    const cert = await this.load(certId);
    cert.revoke(reason);
    await this.repo.update(cert);
  }

  async verify(code: string): Promise<Certificate | null> {
    return this.repo.findByVerificationCode(code);
  }

  async listByEvent(eventId: string): Promise<Certificate[]> {
    return this.repo.findByEventId(eventId);
  }

  private async load(id: string): Promise<Certificate> {
    const cert = await this.repo.findById(id);
    if (!cert) throw new Error(`Certificate not found: ${id}`);
    return cert;
  }
}
