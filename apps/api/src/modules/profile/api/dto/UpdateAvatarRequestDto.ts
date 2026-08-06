import { z } from 'zod';

export const updateAvatarRequestSchema = z.object({
  avatarUrl: z.string().trim().url('Invalid avatar URL').nullable(),
});

export type UpdateAvatarRequestDto = z.infer<typeof updateAvatarRequestSchema>;
