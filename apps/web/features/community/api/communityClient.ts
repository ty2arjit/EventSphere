import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";
import type {
  CommunityResponse,
  CommunityListItem,
  CreateCommunityInput,
  UpdateCommunityInput,
  CreatePositionInput,
  CreateInvitationInput,
  UpdateSettingsInput,
} from "../types";

export function getCommunityById(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommunityResponse>> {
  return request<CommunityResponse>(`/api/v1/communities/${id}`, {
    signal: options.signal,
  });
}

export function getCommunityBySlug(
  slug: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommunityResponse>> {
  return request<CommunityResponse>(`/api/v1/communities/slug/${slug}`, {
    signal: options.signal,
  });
}

export function listMyCommunities(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ data: CommunityListItem[] }>> {
  return request<{ data: CommunityListItem[] }>("/api/v1/communities", {
    signal: options.signal,
  });
}

export function createCommunity(
  input: CreateCommunityInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommunityResponse>> {
  return request<CommunityResponse>("/api/v1/communities", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function updateCommunity(
  id: string,
  input: UpdateCommunityInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommunityResponse>> {
  return request<CommunityResponse>(`/api/v1/communities/${id}`, {
    method: "PATCH",
    body: input,
    signal: options.signal,
  });
}

export function joinCommunity(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommunityResponse>> {
  return request<CommunityResponse>(`/api/v1/communities/${id}/join`, {
    method: "POST",
    signal: options.signal,
  });
}

export function leaveCommunity(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommunityResponse>> {
  return request<CommunityResponse>(`/api/v1/communities/${id}/leave`, {
    method: "POST",
    signal: options.signal,
  });
}

export function createPosition(
  communityId: string,
  input: CreatePositionInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommunityResponse>> {
  return request<CommunityResponse>(
    `/api/v1/communities/${communityId}/positions`,
    { method: "POST", body: input, signal: options.signal },
  );
}

export function createInvitation(
  communityId: string,
  input: CreateInvitationInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommunityResponse>> {
  return request<CommunityResponse>(
    `/api/v1/communities/${communityId}/invitations`,
    { method: "POST", body: input, signal: options.signal },
  );
}

export function acceptInvitation(
  communityId: string,
  invitationId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommunityResponse>> {
  return request<CommunityResponse>(
    `/api/v1/communities/${communityId}/invitations/${invitationId}/accept`,
    { method: "POST", signal: options.signal },
  );
}

export function updateSettings(
  communityId: string,
  input: UpdateSettingsInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommunityResponse>> {
  return request<CommunityResponse>(
    `/api/v1/communities/${communityId}/settings`,
    { method: "PATCH", body: input, signal: options.signal },
  );
}

export function transferOwnership(
  communityId: string,
  newOwnerUserId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<CommunityResponse>> {
  return request<CommunityResponse>(
    `/api/v1/communities/${communityId}/transfer-ownership`,
    { method: "POST", body: { newOwnerUserId }, signal: options.signal },
  );
}
