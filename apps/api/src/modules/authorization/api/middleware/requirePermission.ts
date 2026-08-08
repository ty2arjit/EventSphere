import { Request, Response, NextFunction } from 'express';
import { AuthorizeResourceActionService } from '../../application/AuthorizeResourceActionService';
import { AccessDeniedError } from '../../domain/errors';

export interface ResolvedResourceContext {
  communityId: string;
  eventId?: string | null;
}

export type ResourceContextResolver = (req: Request) => Promise<ResolvedResourceContext>;

/**
 * Enforces a real per-resource permission check via AuthorizeResourceActionService.
 * Must be chained AFTER requireAuth on the route — it trusts req.user is set.
 */
export function requireResourcePermission(
  service: AuthorizeResourceActionService,
  permissionName: string,
  resolveContext: ResourceContextResolver,
) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const { communityId, eventId } = await resolveContext(req);
      const allowed = await service.isAllowed({
        userId: req.user!.id,
        permissionName,
        communityId,
        eventId: eventId ?? null,
      });
      if (!allowed) {
        next(new AccessDeniedError());
        return;
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
