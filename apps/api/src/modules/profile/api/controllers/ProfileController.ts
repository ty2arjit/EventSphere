import { Request, Response, NextFunction } from 'express';
import { RegisterProfileService } from '../../application/RegisterProfileService';
import { GetProfileService } from '../../application/GetProfileService';
import { UpdateProfileService } from '../../application/UpdateProfileService';
import { UpdateAvatarService } from '../../application/UpdateAvatarService';
import { UpdatePreferencesService } from '../../application/UpdatePreferencesService';
import { VerifyIdentityService } from '../../application/VerifyIdentityService';
import { DeactivateProfileService } from '../../application/DeactivateProfileService';
import { ProfileMapper } from '../mappers/ProfileMapper';

/**
 * Every route this controller serves is mounted under a `:id` path segment,
 * so Express guarantees `req.params.id` is present — the cast just satisfies
 * `noUncheckedIndexedAccess`, which can't know that route-level guarantee.
 */
function requireIdParam(req: Request): string {
  return req.params.id as string;
}

/**
 * Translates HTTP <-> Application layer only. No business logic, no
 * repository access, no Prisma (Constitution Article 15).
 */
export class ProfileController {
  constructor(
    private readonly registerProfileService: RegisterProfileService,
    private readonly getProfileService: GetProfileService,
    private readonly updateProfileService: UpdateProfileService,
    private readonly updateAvatarService: UpdateAvatarService,
    private readonly updatePreferencesService: UpdatePreferencesService,
    private readonly verifyIdentityService: VerifyIdentityService,
    private readonly deactivateProfileService: DeactivateProfileService,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.registerProfileService.execute(req.body);
      res.status(201).json(ProfileMapper.toResponseDto(user));
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.getProfileService.execute(requireIdParam(req));
      res.status(200).json(ProfileMapper.toResponseDto(user));
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.updateProfileService.execute({
        id: requireIdParam(req),
        patch: req.body,
      });
      res.status(200).json(ProfileMapper.toResponseDto(user));
    } catch (error) {
      next(error);
    }
  };

  updateAvatar = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.updateAvatarService.execute({
        id: requireIdParam(req),
        avatarUrl: req.body.avatarUrl,
      });
      res.status(200).json(ProfileMapper.toResponseDto(user));
    } catch (error) {
      next(error);
    }
  };

  updatePreferences = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.updatePreferencesService.execute({
        id: requireIdParam(req),
        patch: req.body,
      });
      res.status(200).json(ProfileMapper.toResponseDto(user));
    } catch (error) {
      next(error);
    }
  };

  verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.verifyIdentityService.execute(requireIdParam(req));
      res.status(200).json(ProfileMapper.toResponseDto(user));
    } catch (error) {
      next(error);
    }
  };

  deactivate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.deactivateProfileService.execute(requireIdParam(req));
      res.status(200).json(ProfileMapper.toResponseDto(user));
    } catch (error) {
      next(error);
    }
  };
}
