import { z } from "zod";

export const createEventSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(200),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only"),
  description: z.string().max(2000).optional(),
  mode: z.enum(["Online", "Offline", "Hybrid"]),
  visibility: z.enum(["Public", "Private", "InviteOnly"]),
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;
