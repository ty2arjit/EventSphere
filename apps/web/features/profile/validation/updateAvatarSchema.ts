import { z } from "zod";

/**
 * Client-side validation for the avatar field. An empty input is treated as
 * "no avatar" (submitted as `null`) rather than rejected — the backend's
 * `Avatar` Value Object accepts a URL string or null, never an empty string.
 */
export const updateAvatarSchema = z.object({
  avatarUrl: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? null : value))
    .refine((value) => value === null || /^https?:\/\/.+/i.test(value), {
      message: "Enter a valid http(s) URL, or leave blank.",
    })
    .nullable(),
});

export type UpdateAvatarFormInput = z.input<typeof updateAvatarSchema>;
export type UpdateAvatarFormValues = z.output<typeof updateAvatarSchema>;
