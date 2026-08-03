import { Request, Response, NextFunction } from 'express';
import { RegisterProfileService } from '../application/RegisterProfileService';
import { ProfileMapper } from '../mapper/ProfileMapper';

/**
 * Translates HTTP <-> Application layer only. No business logic, no
 * repository access, no Prisma (Constitution Article 15).
 */
export class ProfileController {
  constructor(private readonly registerProfileService: RegisterProfileService) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = await this.registerProfileService.execute(req.body);
      res.status(201).json(ProfileMapper.toResponseDto(user));
    } catch (error) {
      next(error);
    }
  };
}
