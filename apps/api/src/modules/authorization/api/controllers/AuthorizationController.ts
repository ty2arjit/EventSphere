import { Request, Response, NextFunction } from 'express';
import { ManagePermissionService } from '../../application/ManagePermissionService';
import { ManageGrantService } from '../../application/ManageGrantService';
import { EvaluatePermissionService } from '../../application/EvaluatePermissionService';
import { AuthorizeResourceActionService } from '../../application/AuthorizeResourceActionService';

export class AuthorizationController {
  constructor(
    private readonly managePermissionService: ManagePermissionService,
    private readonly manageGrantService: ManageGrantService,
    private readonly evaluatePermissionService: EvaluatePermissionService,
    private readonly authorizeResourceActionService?: AuthorizeResourceActionService,
  ) {}

  createPermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.managePermissionService.create(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  updatePermission = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.managePermissionService.update({ id: req.params.id as string, ...req.body });
      res.status(204).end();
    } catch (err) { next(err); }
  };

  listPermissions = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const permissions = await this.managePermissionService.list();
      res.json({ data: permissions });
    } catch (err) { next(err); }
  };

  createGrant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.manageGrantService.grant(req.body);
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  revokeGrant = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.manageGrantService.revoke(req.params.id as string);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  listGrants = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const grants = await this.manageGrantService.listActive();
      res.json({ data: grants });
    } catch (err) { next(err); }
  };

  evaluate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const decision = await this.evaluatePermissionService.execute(req.body);
      res.json({ decision });
    } catch (err) { next(err); }
  };

  /**
   * Lets the frontend ask "can the current user perform X here?" without
   * knowing anything about ResponsibilityReferences or grants — it just
   * supplies the permission name and resource context, and the same
   * AuthorizeResourceActionService used to gate the real mutating routes
   * answers. Keeps UI visibility in sync with actual backend enforcement by
   * construction, instead of a separate ad-hoc frontend heuristic.
   */
  canManage = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!this.authorizeResourceActionService) {
        res.json({ allowed: false });
        return;
      }
      const { permission, communityId, eventId } = req.query;
      if (typeof permission !== 'string' || typeof communityId !== 'string') {
        res.status(400).json({ error: 'VALIDATION_ERROR', message: 'permission and communityId query params are required' });
        return;
      }
      const allowed = await this.authorizeResourceActionService.isAllowed({
        userId: req.user!.id,
        permissionName: permission,
        communityId,
        eventId: typeof eventId === 'string' ? eventId : null,
      });
      res.json({ allowed });
    } catch (err) { next(err); }
  };
}
