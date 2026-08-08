import { z } from 'zod';

export const registerRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().trim().min(1, 'Name is required'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
});

export type RegisterRequestDto = z.infer<typeof registerRequestSchema>;
