import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";
import type { EventDashboard, AIInsightResponse } from "../types";

export function getEventDashboard(
  eventId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<EventDashboard>> {
  return request<EventDashboard>(`/api/v1/analytics/dashboard/event/${eventId}`, {
    signal: options.signal,
  });
}

export function getAIInsight(
  input: {
    type: string;
    contextId: string;
    contextType: string;
    query: string;
  },
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AIInsightResponse>> {
  return request<AIInsightResponse>("/api/v1/ai/insight", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function getEventSummary(
  eventId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AIInsightResponse>> {
  return request<AIInsightResponse>(`/api/v1/ai/event/${eventId}/summary`, {
    signal: options.signal,
  });
}
