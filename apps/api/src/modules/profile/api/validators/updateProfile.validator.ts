import { Request, Response, NextFunction } from 'express';
import { updateProfileRequestSchema } from '../dto/UpdateProfileRequestDto';

/**
 * Request-format validation (Constitution Article 23). Business validation
 * (e.g. graduation year range) happens later, inside the aggregate.
 */
export function validateUpdateProfile(req: Request, res: Response, next: NextFunction): void {
  const result = updateProfileRequestSchema.safeParse(req.body);

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
