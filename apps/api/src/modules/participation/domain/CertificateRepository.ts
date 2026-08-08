import type { Certificate } from "./Certificate";

export interface CertificateRepository {
  findById(id: string): Promise<Certificate | null>;
  findByEnrollmentId(enrollmentId: string): Promise<Certificate | null>;
  findByEventId(eventId: string): Promise<Certificate[]>;
  findByVerificationCode(code: string): Promise<Certificate | null>;
  save(certificate: Certificate): Promise<void>;
  update(certificate: Certificate): Promise<void>;
}
