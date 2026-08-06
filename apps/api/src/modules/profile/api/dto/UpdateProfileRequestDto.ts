import { z } from 'zod';

const currentYear = new Date().getFullYear();

export const updateProfileRequestSchema = z.object({
  bio: z.string().trim().max(2000).nullable().optional(),
  headline: z.string().trim().max(200).nullable().optional(),
  institution: z.string().trim().max(200).nullable().optional(),
  department: z.string().trim().max(200).nullable().optional(),
  graduationYear: z
    .number()
    .int()
    .min(1950)
    .max(currentYear + 10)
    .nullable()
    .optional(),
});

export type UpdateProfileRequestDto = z.infer<typeof updateProfileRequestSchema>;
