import { Request, Response, NextFunction } from "express";
import { AnnouncementService } from "../../application/AnnouncementService";

export class AnnouncementController {
  constructor(private readonly service: AnnouncementService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const a = await this.service.create(req.user!.id, req.body.title, req.body.body, {
        communityId: req.body.communityId,
        eventId: req.body.eventId,
        priority: req.body.priority,
        channels: req.body.channels,
      });
      res.status(201).json({ id: a.id, title: a.title, isDraft: a.isDraft });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const a = await this.service.getById(req.params.id as string);
      res.json(a);
    } catch (err) { next(err); }
  };

  listByCommunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await this.service.listByCommunity(req.params.communityId as string);
      res.json({ data: list });
    } catch (err) { next(err); }
  };

  listByEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const list = await this.service.listByEvent(req.params.eventId as string);
      res.json({ data: list });
    } catch (err) { next(err); }
  };

  publish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.publish(req.params.id as string);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  unpublish = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.unpublish(req.params.id as string);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.update(req.params.id as string, req.body.title, req.body.body, req.body.priority);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  remove = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.delete(req.params.id as string);
      res.status(204).end();
    } catch (err) { next(err); }
  };
}
