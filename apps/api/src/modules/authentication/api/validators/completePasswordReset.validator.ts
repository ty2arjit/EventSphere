import { Request, Response, NextFunction } from 'express';
import { completePasswordResetSchema } from '../dto/CompletePasswordResetRequestDto';

export function validateCompletePasswordReset(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const result = completePasswordResetSchema.safeParse(req.body);
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
