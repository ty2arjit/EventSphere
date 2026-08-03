import { request } from '@/lib/api/http';
import type { ApiResult } from '@/lib/api/types';
import type { ProfileResponse, RegisterProfileInput } from '../types';

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
