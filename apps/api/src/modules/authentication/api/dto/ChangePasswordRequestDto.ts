import { z } from 'zod';

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(12, 'New password must be at least 12 characters'),
});

export type ChangePasswordRequestDto = z.infer<typeof changePasswordSchema>;
