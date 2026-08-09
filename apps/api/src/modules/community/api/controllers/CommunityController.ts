import { Request, Response, NextFunction } from 'express';
import { CreateCommunityService } from '../../application/CreateCommunityService';
import { GetCommunityService } from '../../application/GetCommunityService';
import { UpdateCommunityService } from '../../application/UpdateCommunityService';
import { JoinCommunityService } from '../../application/JoinCommunityService';
import { LeaveCommunityService } from '../../application/LeaveCommunityService';
import { ManagePositionService } from '../../application/ManagePositionService';
import { InvitationService } from '../../application/InvitationService';
import { TransferOwnershipService } from '../../application/TransferOwnershipService';
import { UpdateCommunitySettingsService } from '../../application/UpdateCommunitySettingsService';
import { CommunityMapper } from '../mappers/CommunityMapper';

export class CommunityController {
  constructor(
    private readonly createCommunityService: CreateCommunityService,
    private readonly getCommunityService: GetCommunityService,
    private readonly updateCommunityService: UpdateCommunityService,
    private readonly joinCommunityService: JoinCommunityService,
    private readonly leaveCommunityService: LeaveCommunityService,
    private readonly managePositionService: ManagePositionService,
    private readonly invitationService: InvitationService,
    private readonly transferOwnershipService: TransferOwnershipService,
    private readonly updateSettingsService: UpdateCommunitySettingsService,
  ) {}

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const community = await this.createCommunityService.execute({
        ...req.body,
        ownerId: req.user!.id,
      });
      res.status(201).json(CommunityMapper.toResponseDto(community));
    } catch (error) { next(error); }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const community = await this.getCommunityService.execute(req.params.id as string);
      res.status(200).json(CommunityMapper.toResponseDto(community));
    } catch (error) { next(error); }
  };

  getBySlug = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const community = await this.getCommunityService.bySlug(req.params.slug as string);
      res.status(200).json(CommunityMapper.toResponseDto(community));
    } catch (error) { next(error); }
  };

  listMyCommunities = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const communities = await this.getCommunityService.listByMember(req.user!.id);
      res.status(200).json({ data: communities.map(CommunityMapper.toListItemDto) });
    } catch (error) { next(error); }
  };

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const community = await this.updateCommunityService.execute({
        id: req.params.id as string,
        patch: req.body,
      });
      res.status(200).json(CommunityMapper.toResponseDto(community));
    } catch (error) { next(error); }
  };

  join = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.joinCommunityService.execute(req.params.id as string, req.user!.id);
      res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  };

  leave = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.leaveCommunityService.execute(req.params.id as string, req.user!.id);
      res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  };

  createPosition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.managePositionService.createPosition({
        communityId: req.params.id as string,
        ...req.body,
      });
      res.status(201).json({ ok: true });
    } catch (error) { next(error); }
  };

  updatePosition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.managePositionService.updatePosition({
        communityId: req.params.id as string,
        positionId: req.params.positionId as string,
        ...req.body,
      });
      res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  };

  assignPosition = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.managePositionService.assignPosition({
        communityId: req.params.id as string,
        positionId: req.params.positionId as string,
        memberId: req.params.memberId as string,
      });
      res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  };

  removePositionAssignment = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.managePositionService.removeAssignment({
        communityId: req.params.id as string,
        positionId: req.params.positionId as string,
        memberId: req.params.memberId as string,
      });
      res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  };

  createInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.invitationService.createInvitation({
        communityId: req.params.id as string,
        invitedEmail: req.body.email,
        invitedByUserId: req.user!.id,
      });
      res.status(201).json(result);
    } catch (error) { next(error); }
  };

  acceptInvitation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.invitationService.acceptInvitation({
        communityId: req.params.id as string,
        invitationId: req.params.invitationId as string,
        userId: req.user!.id,
      });
      res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  };

  transferOwnership = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.transferOwnershipService.execute(
        req.params.id as string,
        req.body.newOwnerId,
      );
      res.status(200).json({ ok: true });
    } catch (error) { next(error); }
  };

  updateSettings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const community = await this.updateSettingsService.execute({
        communityId: req.params.id as string,
        patch: req.body,
      });
      res.status(200).json(CommunityMapper.toResponseDto(community));
    } catch (error) { next(error); }
  };
}
