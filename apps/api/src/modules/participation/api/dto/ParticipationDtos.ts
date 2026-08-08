export interface RegistrationResponseDto {
  id: string;
  eventId: string;
  approvalStrategy: string;
  window: { opensAt: string; closesAt: string } | null;
  capacity: { maxParticipants: number | null; allowWaitlist: boolean };
  questions: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
    options: string[];
    order: number;
  }>;
  isOpen: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EnrollmentResponseDto {
  id: string;
  registrationId: string;
  eventId: string;
  userId: string;
  status: string;
  responses: Array<{ questionId: string; value: string }>;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
