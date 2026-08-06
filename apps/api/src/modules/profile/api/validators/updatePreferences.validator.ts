import { Request, Response, NextFunction } from 'express';
import { updatePreferencesRequestSchema } from '../dto/UpdatePreferencesRequestDto';

export function validateUpdatePreferences(req: Request, res: Response, next: NextFunction): void {
  const result = updatePreferencesRequestSchema.safeParse(req.body);

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
