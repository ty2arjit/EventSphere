import { Request, Response, NextFunction } from "express";
import { CreateCommitteeService } from "../../application/CreateCommitteeService";
import { GetCommitteeService } from "../../application/GetCommitteeService";
import { TransitionCommitteeService } from "../../application/TransitionCommitteeService";
import { ManageCommitteeRolesService } from "../../application/ManageCommitteeRolesService";
import { toCommitteeResponse } from "../mappers/CommitteeMapper";

export class CommitteeController {
  constructor(
    private readonly createService: CreateCommitteeService,
    private readonly getService: GetCommitteeService,
    private readonly transitionService: TransitionCommitteeService,
    private readonly rolesService: ManageCommitteeRolesService,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const committee = await this.createService.execute(
        req.body.eventId,
        req.body.communityId,
        req.body.name,
      );
      res.status(201).json(toCommitteeResponse(committee));
    } catch (err) {
      next(err);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const committee = await this.getService.byId(req.params.id as string);
      res.json(toCommitteeResponse(committee));
    } catch (err) {
      next(err);
    }
  };

  getByEvent = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const committee = await this.getService.byEventId(req.params.eventId as string);
      if (!committee) return res.status(404).json({ message: "No committee for this event" });
      res.json(toCommitteeResponse(committee));
    } catch (err) {
      next(err);
    }
  };

  transition = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.transitionService.execute(req.params.id as string, req.body.targetState);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  addRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await this.rolesService.addRole(
        req.params.id as string,
        req.body.name,
        req.body.description ?? null,
      );
      res.status(201).json(role);
    } catch (err) {
      next(err);
    }
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.rolesService.updateRole(
        req.params.id as string,
        req.params.roleId as string,
        req.body.name,
        req.body.description ?? null,
      );
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  setReporting = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.rolesService.setReporting(
        req.params.id as string,
        req.params.roleId as string,
        req.body.reportsToRoleId,
      );
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };

  assignMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const assignment = await this.rolesService.assignMember(
        req.params.id as string,
        req.body.roleId,
        req.body.userId,
      );
      res.status(201).json(assignment);
    } catch (err) {
      next(err);
    }
  };

  removeAssignment = async (req: Request, res: Response, next: NextFunction) => {
    try {
      await this.rolesService.removeAssignment(
        req.params.id as string,
        req.params.assignmentId as string,
      );
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };
}
