import { z } from "zod";

/**
 * Client-side validation for the profile registration form.
 *
 * UX ONLY — never a security boundary. The backend re-validates everything and
 * remains authoritative; Constitution Article 29 explicitly forbids assuming UI
 * validation is sufficient. See frontend convention 11.4.
 *
 * Rules deliberately mirror the backend's `User.register()` domain rules so the
 * client doesn't reject input the server would accept, or vice versa:
 *
 *   backend                          | here
 *   ---------------------------------|--------------------------------
 *   email.trim().toLowerCase()       | .trim().toLowerCase()
 *   /^[^\s@]+@[^\s@]+\.[^\s@]+$/     | .email()
 *   name.trim(), length > 0          | .trim().min(1)
 *
 * `.email()` is stricter than the backend's regex, so anything accepted here is
 * also accepted there — divergence can only cause an extra client-side hint,
 * never a surprise server rejection.
 *
 * Normalisation (`trim`/`toLowerCase`) is applied here too, so a stray trailing
 * space doesn't produce a spurious validation error the backend wouldn't raise.
 * The backend still normalises independently — this is convenience, not a
 * transfer of responsibility.
 */
export const registerProfileSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, { message: "Email is required." })
    .email({ message: "Enter a valid email address." }),
  name: z.string().trim().min(1, { message: "Name is required." }),
});

/** Field shape as typed by the user (pre-transform) — what the form inputs bind to. */
export type RegisterProfileFormInput = z.input<typeof registerProfileSchema>;

/** Validated, normalised values (post-transform) — what the submit handler receives. */
export type RegisterProfileFormValues = z.output<typeof registerProfileSchema>;
