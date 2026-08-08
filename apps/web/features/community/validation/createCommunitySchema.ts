import { z } from "zod";

export const createCommunitySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase with hyphens only"),
  description: z.string().max(500).optional(),
});

export type CreateCommunityFormValues = z.infer<typeof createCommunitySchema>;
