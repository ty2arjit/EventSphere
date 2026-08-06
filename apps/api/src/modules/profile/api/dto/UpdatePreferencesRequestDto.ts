import { z } from 'zod';

export const updatePreferencesRequestSchema = z.object({
  language: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
  theme: z.enum(['light', 'dark', 'system']).optional(),
  notifyByEmail: z.boolean().optional(),
  notifyInApp: z.boolean().optional(),
});

export type UpdatePreferencesRequestDto = z.infer<typeof updatePreferencesRequestSchema>;
