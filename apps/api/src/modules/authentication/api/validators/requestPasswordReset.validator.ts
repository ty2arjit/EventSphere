import { Request, Response, NextFunction } from 'express';
import { requestPasswordResetSchema } from '../dto/RequestPasswordResetRequestDto';

export function validateRequestPasswordReset(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = requestPasswordResetSchema.safeParse(req.body);
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
