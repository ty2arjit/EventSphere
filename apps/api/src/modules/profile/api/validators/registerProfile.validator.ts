import { Request, Response, NextFunction } from 'express';
import { registerProfileRequestSchema } from '../dto/RegisterProfileRequestDto';

/**
 * Request-format validation (Constitution Article 23) — required fields,
 * type, format. Business validation (uniqueness) happens later, in the
 * Application Service. This is the only place req.body is trusted after.
 */
export function validateRegisterProfile(req: Request, res: Response, next: NextFunction): void {
  const result = registerProfileRequestSchema.safeParse(req.body);

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
