import { z } from 'zod';

export const confirmEmailVerificationOtpSchema = z.object({
  email: z.string().email('Invalid email address'),
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
});

export type ConfirmEmailVerificationOtpRequestDto = z.infer<
  typeof confirmEmailVerificationOtpSchema
>;
