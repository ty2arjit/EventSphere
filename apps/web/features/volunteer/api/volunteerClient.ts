import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";
import type { TaskResponse, CreateTaskInput } from "../types";

export function listTasks(
  eventId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<TaskResponse[]>> {
  return request<TaskResponse[]>(`/api/v1/tasks/event/${eventId}`, { signal: options.signal });
}

export function getTask(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<TaskResponse>> {
  return request<TaskResponse>(`/api/v1/tasks/${id}`, { signal: options.signal });
}

export function createTask(
  input: CreateTaskInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<TaskResponse>> {
  return request<TaskResponse>("/api/v1/tasks", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function transitionTask(
  id: string,
  targetStatus: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/tasks/${id}/transition`, {
    method: "POST",
    body: { targetStatus },
    signal: options.signal,
  });
}

export function assignTask(
  id: string,
  userId: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<void>> {
  return request<void>(`/api/v1/tasks/${id}/assign`, {
    method: "POST",
    body: { userId },
    signal: options.signal,
  });
}
