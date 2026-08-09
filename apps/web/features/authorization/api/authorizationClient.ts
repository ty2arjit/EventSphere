import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";

export interface PermissionResponse {
  id: string;
  name: string;
  description: string | null;
}

export interface GrantResponse {
  id: string;
  permissionId: string;
  contextLevel: "Platform" | "Community" | "Event";
  contextId: string | null;
  responsibilityRef: { type: "CommunityPosition" | "CommitteeRole" | "PlatformAdmin"; id: string };
}

export function listPermissions(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ data: PermissionResponse[] }>> {
  return request<{ data: PermissionResponse[] }>("/api/v1/authorization/permissions", {
    signal: options.signal,
  });
}

export function listGrants(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ data: GrantResponse[] }>> {
  return request<{ data: GrantResponse[] }>("/api/v1/authorization/grants", {
    signal: options.signal,
  });
}

export function createGrant(
  input: {
    permissionId: string;
    contextLevel: "Community" | "Event";
    contextId: string;
    responsibilityRef: { type: "CommunityPosition" | "CommitteeRole"; id: string };
  },
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ grantId: string }>> {
  return request<{ grantId: string }>("/api/v1/authorization/grants", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function revokeGrant(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/authorization/grants/${id}`, {
    method: "DELETE",
    signal: options.signal,
  });
}

export function canManage(
  permission: string,
  communityId: string,
  eventId?: string | null,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ allowed: boolean }>> {
  const params = new URLSearchParams({ permission, communityId });
  if (eventId) params.set("eventId", eventId);
  return request<{ allowed: boolean }>(`/api/v1/authorization/can-manage?${params.toString()}`, {
    signal: options.signal,
  });
}
