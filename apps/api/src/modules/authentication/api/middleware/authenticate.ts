import { Request, Response, NextFunction } from 'express';
import { JwtService } from '../../infrastructure/JoseJwtService';

export function createAuthenticateMiddleware(jwtService: JwtService) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    req.user = null;

    const token = req.cookies?.es_access as string | undefined;
    if (!token) {
      next();
      return;
    }

    try {
      const claims = await jwtService.verifyAccessToken(token);
      req.user = {
        id: claims.sub,
        sessionId: claims.sessionId,
        emailVerified: claims.emailVerified,
      };
    } catch {
      // Invalid/expired token — treat as unauthenticated, not an error.
      // The client will try /refresh to get a new access token.
    }

    next();
  };
}
