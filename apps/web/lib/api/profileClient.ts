import { request } from './http';
import { ApiResult, ProfileResponse } from './types';

/**
 * The frontend's single gateway to the Profile endpoints.
 *
 * Contains no business logic and no validation of its own — it declares the
 * endpoint contract and delegates all transport concerns to `request()`.
 * Validation belongs to Zod (UX) and the backend Domain layer (authoritative).
 */

export interface RegisterProfileInput {
  email: string;
  name: string;
}

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
