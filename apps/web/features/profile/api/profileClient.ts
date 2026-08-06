import { request } from '@/lib/api/http';
import type { ApiResult } from '@/lib/api/types';
import type {
  ProfileResponse,
  RegisterProfileInput,
  UpdateProfileInput,
  UpdateAvatarInput,
  UpdatePreferencesInput,
} from '../types';

/**
 * Profile feature's gateway to its own API endpoints.
 *
 * Contains no business logic and no validation of its own — it declares the
 * endpoint contract and delegates all transport concerns to `lib/api/http`.
 * Validation belongs to Zod (UX) and the backend Domain layer (authoritative).
 */

export function registerProfile(
  input: RegisterProfileInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<ProfileResponse>> {
  return request<ProfileResponse>('/api/v1/profile', {
    method: 'POST',
    body: input,
    signal: options.signal,
  });
}

export function getProfile(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<ProfileResponse>> {
  return request<ProfileResponse>(`/api/v1/profile/${id}`, {
    signal: options.signal,
  });
}

export function updateProfile(
  id: string,
  input: UpdateProfileInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<ProfileResponse>> {
  return request<ProfileResponse>(`/api/v1/profile/${id}`, {
    method: 'PATCH',
    body: input,
    signal: options.signal,
  });
}

export function updateAvatar(
  id: string,
  input: UpdateAvatarInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<ProfileResponse>> {
  return request<ProfileResponse>(`/api/v1/profile/${id}/avatar`, {
    method: 'PATCH',
    body: input,
    signal: options.signal,
  });
}

export function updatePreferences(
  id: string,
  input: UpdatePreferencesInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<ProfileResponse>> {
  return request<ProfileResponse>(`/api/v1/profile/${id}/preferences`, {
    method: 'PATCH',
    body: input,
    signal: options.signal,
  });
}

export function verifyProfile(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<ProfileResponse>> {
  return request<ProfileResponse>(`/api/v1/profile/${id}/verify`, {
    method: 'POST',
    signal: options.signal,
  });
}

export function deactivateProfile(
  id: string,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<ProfileResponse>> {
  return request<ProfileResponse>(`/api/v1/profile/${id}/deactivate`, {
    method: 'POST',
    signal: options.signal,
  });
}
