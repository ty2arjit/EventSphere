import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";
import type {
  AcknowledgementResponse,
  AuthResultResponse,
  AuthenticatedUser,
  ChangePasswordInput,
  EmailVerificationInput,
  LoginInput,
  PasswordResetInput,
  PasswordResetRequestInput,
  RegisterInput,
} from "../types";

export function register(
  input: RegisterInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AcknowledgementResponse>> {
  return request<AcknowledgementResponse>("/api/v1/auth/register", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function login(
  input: LoginInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AuthResultResponse>> {
  return request<AuthResultResponse>("/api/v1/auth/login", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function logout(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AcknowledgementResponse>> {
  return request<AcknowledgementResponse>("/api/v1/auth/logout", {
    method: "POST",
    signal: options.signal,
  });
}

export function logoutEverywhere(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AcknowledgementResponse>> {
  return request<AcknowledgementResponse>("/api/v1/auth/logout-everywhere", {
    method: "POST",
    signal: options.signal,
  });
}

export function refresh(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AcknowledgementResponse>> {
  return request<AcknowledgementResponse>("/api/v1/auth/refresh", {
    method: "POST",
    signal: options.signal,
  });
}

export function getMe(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<{ user: AuthenticatedUser }>> {
  return request<{ user: AuthenticatedUser }>("/api/v1/auth/me", {
    signal: options.signal,
  });
}

export function requestEmailVerification(
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AcknowledgementResponse>> {
  return request<AcknowledgementResponse>(
    "/api/v1/auth/email/request-verification",
    { method: "POST", signal: options.signal },
  );
}

export function confirmEmailVerification(
  input: EmailVerificationInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AcknowledgementResponse>> {
  return request<AcknowledgementResponse>("/api/v1/auth/email/verify", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function confirmEmailVerificationOtp(
  input: { email: string; code: string },
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AcknowledgementResponse>> {
  return request<AcknowledgementResponse>("/api/v1/auth/email/verify/otp", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function requestPasswordReset(
  input: PasswordResetRequestInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AcknowledgementResponse>> {
  return request<AcknowledgementResponse>(
    "/api/v1/auth/password/request-reset",
    { method: "POST", body: input, signal: options.signal },
  );
}

export function completePasswordReset(
  input: PasswordResetInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AcknowledgementResponse>> {
  return request<AcknowledgementResponse>("/api/v1/auth/password/reset", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}

export function changePassword(
  input: ChangePasswordInput,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<AcknowledgementResponse>> {
  return request<AcknowledgementResponse>("/api/v1/auth/password/change", {
    method: "POST",
    body: input,
    signal: options.signal,
  });
}
