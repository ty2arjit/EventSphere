import { z } from 'zod';

export const requestPasswordResetSchema = z.object({
  email: z.string().min(1, 'Email is required'),
});

export type RequestPasswordResetRequestDto = z.infer<typeof requestPasswordResetSchema>;
