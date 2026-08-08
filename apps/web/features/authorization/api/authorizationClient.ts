import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";

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
