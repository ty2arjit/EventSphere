import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";
import type { CommitteeResponse, CreateCommitteeInput } from "../types";

export function getCommitteeById(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommitteeResponse>> {
  return request<CommitteeResponse>(`/api/v1/committees/${id}`, { signal: options.signal });
}

export function getCommitteeByEventId(
  eventId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommitteeResponse>> {
  return request<CommitteeResponse>(`/api/v1/committees/event/${eventId}`, { signal: options.signal });
}

export function createCommittee(
  input: CreateCommitteeInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommitteeResponse>> {
  return request<CommitteeResponse>("/api/v1/committees", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function transitionCommittee(
  id: string,
  targetState: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/committees/${id}/transition`, {
    method: "POST",
    body: { targetState },
    signal: options.signal,
  });
}

export function addCommitteeRole(
  committeeId: string,
  input: { name: string; description?: string | null },
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ id: string; name: string }>> {
  return request(`/api/v1/committees/${committeeId}/roles`, {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function assignMemberToRole(
  committeeId: string,
  roleId: string,
  userId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ id: string }>> {
  return request(`/api/v1/committees/${committeeId}/assignments`, {
    method: "POST",
    body: { roleId, userId },
    signal: options.signal,
  });
}

export function removeAssignment(
  committeeId: string,
  assignmentId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request(`/api/v1/committees/${committeeId}/assignments/${assignmentId}`, {
    method: "DELETE",
    signal: options.signal,
  });
}
