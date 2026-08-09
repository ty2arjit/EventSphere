import { Request, Response, NextFunction } from "express";
import { ManageTaskService } from "../../application/ManageTaskService";

export class VolunteerController {
  constructor(private readonly service: ManageTaskService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await this.service.create(
        req.body.eventId,
        req.body.title,
        req.body.priority,
        req.body.committeeRoleId ?? null,
      );
      res.status(201).json({ id: task.id, title: task.title, status: task.status });
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const task = await this.service.getById(req.params.id as string);
      res.json(task);
    } catch (err) { next(err); }
  };

  listByEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tasks = await this.service.listByEvent(req.params.eventId as string);
      res.json({ data: tasks });
    } catch (err) { next(err); }
  };

  transition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.transition(req.params.id as string, req.body.targetStatus);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  assign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const a = await this.service.assign(req.params.id as string, req.body.userId);
      res.status(201).json(a);
    } catch (err) { next(err); }
  };

  unassign = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.unassign(req.params.id as string, req.body.userId);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.update(req.params.id as string, req.body);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  addChecklistItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const item = await this.service.addChecklistItem(req.params.id as string, req.body.label);
      res.status(201).json(item);
    } catch (err) { next(err); }
  };

  toggleChecklistItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.service.toggleChecklistItem(req.params.id as string, req.params.itemId as string);
      res.status(204).end();
    } catch (err) { next(err); }
  };
}
