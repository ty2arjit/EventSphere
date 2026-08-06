import { z } from "zod";

/**
 * Client-side validation for the preferences form. UX only — mirrors the
 * backend's `updatePreferencesRequestSchema`.
 */
export const updatePreferencesSchema = z.object({
  language: z.string().trim().min(1).optional(),
  timezone: z.string().trim().min(1).optional(),
  theme: z.enum(["light", "dark", "system"]).optional(),
  notifyByEmail: z.boolean().optional(),
  notifyInApp: z.boolean().optional(),
});

export type UpdatePreferencesFormInput = z.input<typeof updatePreferencesSchema>;
export type UpdatePreferencesFormValues = z.output<typeof updatePreferencesSchema>;
