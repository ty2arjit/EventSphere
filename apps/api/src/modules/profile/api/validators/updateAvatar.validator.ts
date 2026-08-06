import { Request, Response, NextFunction } from 'express';
import { updateAvatarRequestSchema } from '../dto/UpdateAvatarRequestDto';

export function validateUpdateAvatar(req: Request, res: Response, next: NextFunction): void {
  const result = updateAvatarRequestSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'VALIDATION_ERROR',
      message: 'Invalid request body',
      details: result.error.flatten(),
    });
    return;
  }

  req.body = result.data;
  next();
}
