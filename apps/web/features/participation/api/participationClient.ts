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
  return request<RegistrationResponse>(`/api/v1/participation/registration/event/${eventId}`, {
    signal: options.signal,
  });
}

export function createRegistration(
  eventId: string,
  input: { approvalStrategy?: string; maxParticipants?: number; allowWaitlist?: boolean },
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<RegistrationResponse>> {
  return request<RegistrationResponse>("/api/v1/participation/registration", {
    method: "POST",
    body: { eventId, ...input },
    signal: options.signal,
  });
}

export function openRegistration(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/participation/registration/${id}/open`, {
    method: "POST",
    signal: options.signal,
  });
}

export function closeRegistration(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/participation/registration/${id}/close`, {
    method: "POST",
    signal: options.signal,
  });
}

export function enroll(
  eventId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<EnrollmentResponse>> {
  return request<EnrollmentResponse>("/api/v1/participation/enrollment", {
    method: "POST",
    body: { eventId },
    signal: options.signal,
  });
}

export function listEnrollments(
  eventId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<EnrollmentResponse[]>> {
  return request<EnrollmentResponse[]>(`/api/v1/participation/enrollment/event/${eventId}`, {
    signal: options.signal,
  });
}

export function approveEnrollment(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/participation/enrollment/${id}/approve`, {
    method: "POST",
    signal: options.signal,
  });
}

export function rejectEnrollment(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/participation/enrollment/${id}/reject`, {
    method: "POST",
    signal: options.signal,
  });
}

export function verifyCertificate(
  code: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CertificateResponse>> {
  return request<CertificateResponse>(`/api/v1/participation/certificate/verify/${code}`, {
    signal: options.signal,
  });
}
