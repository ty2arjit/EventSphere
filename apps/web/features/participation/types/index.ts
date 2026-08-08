export interface RegistrationResponse {
  id: string;
  eventId: string;
  approvalStrategy: string;
  windowOpensAt: string | null;
  windowClosesAt: string | null;
  maxParticipants: number | null;
  allowWaitlist: boolean;
  isOpen: boolean;
  questions: RegistrationQuestion[];
  createdAt: string;
}

export interface RegistrationQuestion {
  id: string;
  type: "Text" | "Number" | "Select" | "MultiSelect" | "File" | "Date";
  label: string;
  required: boolean;
  options?: string[];
}

export interface EnrollmentResponse {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  status: string;
  responses: unknown[];
  createdAt: string;
}

export interface AttendanceResponse {
  id: string;
  enrollmentId: string;
  eventId: string;
  sessionId: string;
  userId: string;
  status: string;
  checkInAt: string | null;
  checkOutAt: string | null;
}

export interface CertificateResponse {
  id: string;
  enrollmentId: string;
  eventId: string;
  userId: string;
  status: string;
  verificationCode: string;
  issuedAt: string | null;
}
