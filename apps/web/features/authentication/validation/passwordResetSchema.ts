import { z } from "zod";

export const requestPasswordResetSchema = z.object({
  email: z.string().min(1, "Email is required"),
});

export type RequestPasswordResetFormValues = z.infer<
  typeof requestPasswordResetSchema
>;

export const completePasswordResetSchema = z.object({
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
});

export type CompletePasswordResetFormValues = z.infer<
  typeof completePasswordResetSchema
>;
