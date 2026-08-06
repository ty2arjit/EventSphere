import { z } from "zod";

const currentYear = new Date().getFullYear();

/**
 * Client-side validation for the profile edit form (bio/headline/
 * institution/department/graduationYear). UX only — mirrors the backend's
 * `updateProfileRequestSchema`, which stays authoritative (Constitution
 * Article 29).
 */
export const updateProfileSchema = z.object({
  bio: z.string().trim().max(2000).nullable().optional(),
  headline: z.string().trim().max(200).nullable().optional(),
  institution: z.string().trim().max(200).nullable().optional(),
  department: z.string().trim().max(200).nullable().optional(),
  // RHF's `valueAsNumber` turns an empty number input into `NaN`, not
  // `undefined` — normalize that here so an untouched field validates as
  // "not provided" rather than failing with "Expected number, received nan".
  graduationYear: z.preprocess(
    (value) => (typeof value === "number" && Number.isNaN(value) ? undefined : value),
    z
      .number()
      .int()
      .min(1950)
      .max(currentYear + 10)
      .nullable()
      .optional(),
  ),
});

export type UpdateProfileFormInput = z.input<typeof updateProfileSchema>;
export type UpdateProfileFormValues = z.output<typeof updateProfileSchema>;
