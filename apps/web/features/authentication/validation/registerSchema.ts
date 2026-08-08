import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().trim().min(1, "Name is required"),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters")
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/[0-9]/, "Password must contain at least one digit"),
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
