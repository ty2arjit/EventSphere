import { Request, Response, NextFunction } from 'express';
import { loginRequestSchema } from '../dto/LoginRequestDto';

export function validateLogin(req: Request, res: Response, next: NextFunction): void {
  const result = loginRequestSchema.safeParse(req.body);
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
