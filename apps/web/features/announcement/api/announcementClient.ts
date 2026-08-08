import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";
import type { AnnouncementResponse, CreateAnnouncementInput } from "../types";

export function listByCommunity(
  communityId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AnnouncementResponse[]>> {
  return request<AnnouncementResponse[]>(`/api/v1/announcements/community/${communityId}`, {
    signal: options.signal,
  });
}

export function listByEvent(
  eventId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AnnouncementResponse[]>> {
  return request<AnnouncementResponse[]>(`/api/v1/announcements/event/${eventId}`, {
    signal: options.signal,
  });
}

export function createAnnouncement(
  input: CreateAnnouncementInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AnnouncementResponse>> {
  return request<AnnouncementResponse>("/api/v1/announcements", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function publishAnnouncement(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/announcements/${id}/publish`, {
    method: "POST",
    signal: options.signal,
  });
}

export function deleteAnnouncement(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/announcements/${id}`, {
    method: "DELETE",
    signal: options.signal,
  });
}
