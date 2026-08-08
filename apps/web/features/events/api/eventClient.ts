import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";
import type { EventResponse, EventListItem, CreateEventInput } from "../types";

export function getEventById(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<EventResponse>> {
  return request<EventResponse>(`/api/v1/events/${id}`, { signal: options.signal });
}

export function getEventBySlug(
  slug: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<EventResponse>> {
  return request<EventResponse>(`/api/v1/events/slug/${slug}`, { signal: options.signal });
}

export function listEventsByCommunity(
  communityId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ data: EventListItem[] }>> {
  return request<{ data: EventListItem[] }>(`/api/v1/events/community/${communityId}`, {
    signal: options.signal,
  });
}

export function createEvent(
  input: CreateEventInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<EventResponse>> {
  return request<EventResponse>("/api/v1/events", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function updateEvent(
  id: string,
  input: Record<string, unknown>,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/events/${id}`, {
    method: "PATCH",
    body: input,
    signal: options.signal,
  });
}

export function transitionEvent(
  id: string,
  targetState: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/events/${id}/transition`, {
    method: "POST",
    body: { targetState },
    signal: options.signal,
  });
}

export function addSession(
  eventId: string,
  input: { title: string; description?: string | null },
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ sessionId: string }>> {
  return request<{ sessionId: string }>(`/api/v1/events/${eventId}/sessions`, {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}
