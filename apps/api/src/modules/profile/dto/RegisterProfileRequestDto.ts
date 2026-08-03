import { z } from 'zod';

export const registerProfileRequestSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().trim().min(1, 'Name is required'),
});

export type RegisterProfileRequestDto = z.infer<typeof registerProfileRequestSchema>;
