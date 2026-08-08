export interface AuthenticatedUser {
  id: string;
  email: string;
  emailVerified: boolean;
  providers: Array<{ provider: string; linkedAt: string }>;
}

export interface AuthResultResponse {
  user: AuthenticatedUser;
}

export interface AcknowledgementResponse {
  ok: true;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export interface PasswordResetRequestInput {
  email: string;
}

export interface PasswordResetInput {
  token: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export interface EmailVerificationInput {
  token: string;
}
