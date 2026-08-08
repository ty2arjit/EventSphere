import { z } from 'zod';

export const completePasswordResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

export type CompletePasswordResetRequestDto = z.infer<typeof completePasswordResetSchema>;
