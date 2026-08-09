import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";
import type {
  RegistrationResponse,
  EnrollmentResponse,
  CertificateResponse,
} from "../types";

export function getRegistration(
  eventId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<RegistrationResponse>> {
  return request<RegistrationResponse>(`/api/v1/participation/registrations/event/${eventId}`, {
    signal: options.signal,
  });
}

export function createRegistration(
  eventId: string,
  input: { approvalStrategy?: string; maxParticipants?: number; allowWaitlist?: boolean },
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<RegistrationResponse>> {
  return request<RegistrationResponse>("/api/v1/participation/registrations", {
    method: "POST",
    body: { eventId, ...input },
    signal: options.signal,
  });
}

export function openRegistration(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/participation/registrations/${id}/open`, {
    method: "POST",
    signal: options.signal,
  });
}

export function closeRegistration(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/participation/registrations/${id}/close`, {
    method: "POST",
    signal: options.signal,
  });
}

export function enroll(
  eventId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<EnrollmentResponse>> {
  return request<EnrollmentResponse>("/api/v1/participation/enrollments", {
    method: "POST",
    body: { eventId },
    signal: options.signal,
  });
}

export function listEnrollments(
  eventId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ data: EnrollmentResponse[] }>> {
  return request<{ data: EnrollmentResponse[] }>(`/api/v1/participation/enrollments/event/${eventId}`, {
    signal: options.signal,
  });
}

export function approveEnrollment(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/participation/enrollments/${id}/approve`, {
    method: "POST",
    signal: options.signal,
  });
}

export function rejectEnrollment(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/participation/enrollments/${id}/reject`, {
    method: "POST",
    signal: options.signal,
  });
}

export function getCheckInQr(
  enrollmentId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ qrCodeDataUrl: string; token: string; expiresAt: string }>> {
  return request<{ qrCodeDataUrl: string; token: string; expiresAt: string }>(
    `/api/v1/participation/enrollments/${enrollmentId}/qr-code`,
    { signal: options.signal },
  );
}

export function checkInByQr(
  input: { token: string; eventId: string; sessionId: string },
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ id: string; status: string; checkInAt: string | null }>> {
  return request<{ id: string; status: string; checkInAt: string | null }>(
    "/api/v1/participation/attendance/check-in-by-qr",
    { method: "POST", body: input, signal: options.signal },
  );
}

export function verifyCertificate(
  code: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CertificateResponse>> {
  return request<CertificateResponse>(`/api/v1/participation/certificates/verify/${code}`, {
    signal: options.signal,
  });
}
