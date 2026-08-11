import { Request, Response, NextFunction } from 'express';
import { CreateEventService } from '../../application/CreateEventService';
import { GetEventService } from '../../application/GetEventService';
import { UpdateEventService } from '../../application/UpdateEventService';
import { TransitionEventService } from '../../application/TransitionEventService';
import { ManageSessionService } from '../../application/ManageSessionService';
import { toEventResponse, toEventListItem, toEventBrowseItem } from '../mappers/EventMapper';

export class EventController {
  constructor(
    private readonly createEventService: CreateEventService,
    private readonly getEventService: GetEventService,
    private readonly updateEventService: UpdateEventService,
    private readonly transitionEventService: TransitionEventService,
    private readonly manageSessionService: ManageSessionService,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await this.createEventService.execute(req.body);
      res.status(201).json(toEventResponse(event));
    } catch (err) { next(err); }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await this.getEventService.byId(req.params.id as string);
      res.json(toEventResponse(event));
    } catch (err) { next(err); }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const event = await this.getEventService.bySlug(req.params.slug as string);
      res.json(toEventResponse(event));
    } catch (err) { next(err); }
  };

  listByCommunity = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const events = await this.getEventService.byCommunity(req.params.communityId as string);
      res.json({ data: events.map(toEventListItem) });
    } catch (err) { next(err); }
  };

  browse = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = typeof req.query.q === 'string' && req.query.q.trim() ? req.query.q.trim() : null;
      const page = Number(req.query.page ?? 0) || 0;
      const pageSize = Number(req.query.pageSize ?? 20) || 20;
      const { items, total } = await this.getEventService.browse(query, page, pageSize);
      res.status(200).json({ data: items.map(toEventBrowseItem), total, page, pageSize });
    } catch (err) { next(err); }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const input = { ...req.body, id: req.params.id as string };
      if (input.startDate) input.startDate = new Date(input.startDate);
      if (input.endDate) input.endDate = new Date(input.endDate);
      await this.updateEventService.execute(input);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  transition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.transitionEventService.execute(req.params.id as string, req.body.targetState);
      res.status(204).end();
    } catch (err) { next(err); }
  };

  addSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await this.manageSessionService.addSession(
        req.params.id as string,
        req.body.title,
        req.body.description ?? null,
      );
      res.status(201).json(result);
    } catch (err) { next(err); }
  };

  updateSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.manageSessionService.updateSession(
        req.params.id as string,
        req.params.sessionId as string,
        req.body,
      );
      res.status(204).end();
    } catch (err) { next(err); }
  };

  scheduleSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.manageSessionService.scheduleSession(
        req.params.id as string,
        req.params.sessionId as string,
        { startAt: new Date(req.body.startAt), endAt: new Date(req.body.endAt) },
      );
      res.status(204).end();
    } catch (err) { next(err); }
  };

  startSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.manageSessionService.startSession(
        req.params.id as string,
        req.params.sessionId as string,
      );
      res.status(204).end();
    } catch (err) { next(err); }
  };

  completeSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.manageSessionService.completeSession(
        req.params.id as string,
        req.params.sessionId as string,
      );
      res.status(204).end();
    } catch (err) { next(err); }
  };

  cancelSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.manageSessionService.cancelSession(
        req.params.id as string,
        req.params.sessionId as string,
      );
      res.status(204).end();
    } catch (err) { next(err); }
  };
}
