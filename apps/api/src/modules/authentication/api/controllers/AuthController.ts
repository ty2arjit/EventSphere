import { Request, Response, NextFunction, CookieOptions } from 'express';
import { RegisterCredentialService } from '../../application/RegisterCredentialService';
import { AuthenticateWithPasswordService } from '../../application/AuthenticateWithPasswordService';
import { RefreshSessionService } from '../../application/RefreshSessionService';
import { LogoutService } from '../../application/LogoutService';
import { LogoutEverywhereService } from '../../application/LogoutEverywhereService';
import { RequestEmailVerificationService } from '../../application/RequestEmailVerificationService';
import { ConfirmEmailVerificationService } from '../../application/ConfirmEmailVerificationService';
import { RequestPasswordResetService } from '../../application/RequestPasswordResetService';
import { CompletePasswordResetService } from '../../application/CompletePasswordResetService';
import { ChangePasswordService } from '../../application/ChangePasswordService';
import { UserCredentialRepository } from '../../domain/UserCredentialRepository';
import { AuthMapper } from '../mappers/AuthMapper';
import { AuthConfig } from '../../application/AuthConfig';
import { AcknowledgementResponseDto } from '../dto/AuthenticatedUserResponseDto';

const IS_PROD = process.env.NODE_ENV === 'production';

// The web app (Vercel) and API (Railway) are different registrable domains,
// so cookies must be SameSite=None to survive a cross-site fetch — Lax only
// attaches on top-level navigation, never on XHR/fetch. SameSite=None is only
// valid when Secure is also true (browsers reject it otherwise), which is
// why both are gated on the same flag rather than set independently.
const COOKIE_SAME_SITE: CookieOptions['sameSite'] = IS_PROD ? 'none' : 'lax';

function accessCookieOptions(ttlSeconds: number): CookieOptions {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: COOKIE_SAME_SITE,
    path: '/',
    maxAge: ttlSeconds * 1000,
  };
}

function refreshCookieOptions(ttlSeconds: number): CookieOptions {
  return {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: COOKIE_SAME_SITE,
    path: '/api/v1/auth',
    maxAge: ttlSeconds * 1000,
  };
}

const CLEAR_COOKIE: CookieOptions = {
  httpOnly: true,
  secure: IS_PROD,
  sameSite: COOKIE_SAME_SITE,
  path: '/',
  maxAge: 0,
};

const ACK: AcknowledgementResponseDto = { ok: true };

export class AuthController {
  constructor(
    private readonly registerCredentialService: RegisterCredentialService,
    private readonly authenticateWithPasswordService: AuthenticateWithPasswordService,
    private readonly refreshSessionService: RefreshSessionService,
    private readonly logoutService: LogoutService,
    private readonly logoutEverywhereService: LogoutEverywhereService,
    private readonly requestEmailVerificationService: RequestEmailVerificationService,
    private readonly confirmEmailVerificationService: ConfirmEmailVerificationService,
    private readonly requestPasswordResetService: RequestPasswordResetService,
    private readonly completePasswordResetService: CompletePasswordResetService,
    private readonly changePasswordService: ChangePasswordService,
    private readonly credentialRepository: UserCredentialRepository,
    private readonly config: AuthConfig,
  ) {}

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.registerCredentialService.execute(req.body);
      res.status(200).json(ACK);
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.authenticateWithPasswordService.execute({
        email: req.body.email,
        password: req.body.password,
        deviceLabel: req.headers['user-agent'] ?? null,
        ipAddress: req.ip ?? null,
      });

      const credential = await this.credentialRepository.findByEmail(req.body.email);

      res.cookie('es_access', result.accessToken, accessCookieOptions(this.config.accessTokenTtlSeconds));
      res.cookie('es_refresh', result.refreshToken, refreshCookieOptions(this.config.refreshTokenTtlSeconds));
      res.status(200).json({ user: credential ? AuthMapper.toAuthenticatedUserDto(credential) : undefined });
    } catch (error) {
      next(error);
    }
  };

  refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawRefreshToken = req.cookies?.es_refresh as string | undefined;
      if (!rawRefreshToken) {
        res.status(401).json({ error: 'AUTHENTICATION_REQUIRED', message: 'No refresh token' });
        return;
      }

      const result = await this.refreshSessionService.execute(rawRefreshToken);
      res.cookie('es_access', result.accessToken, accessCookieOptions(this.config.accessTokenTtlSeconds));
      res.cookie('es_refresh', result.refreshToken, refreshCookieOptions(this.config.refreshTokenTtlSeconds));
      res.status(200).json(ACK);
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (req.user) {
        await this.logoutService.execute({
          userCredentialId: req.user.id,
          sessionId: req.user.sessionId,
        });
      }
      res.cookie('es_access', '', CLEAR_COOKIE);
      res.cookie('es_refresh', '', { ...CLEAR_COOKIE, path: '/api/v1/auth' });
      res.status(200).json(ACK);
    } catch (error) {
      next(error);
    }
  };

  logoutEverywhere = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.logoutEverywhereService.execute(req.user!.id);
      res.cookie('es_access', '', CLEAR_COOKIE);
      res.cookie('es_refresh', '', { ...CLEAR_COOKIE, path: '/api/v1/auth' });
      res.status(200).json(ACK);
    } catch (error) {
      next(error);
    }
  };

  requestEmailVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.requestEmailVerificationService.execute(req.user!.id);
      res.status(200).json(ACK);
    } catch (error) {
      next(error);
    }
  };

  confirmEmailVerification = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.confirmEmailVerificationService.execute(req.body.token);
      res.status(200).json(ACK);
    } catch (error) {
      next(error);
    }
  };

  requestPasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.requestPasswordResetService.execute(req.body.email);
      res.status(200).json(ACK);
    } catch (error) {
      next(error);
    }
  };

  completePasswordReset = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.completePasswordResetService.execute({
        rawToken: req.body.token,
        newPassword: req.body.password,
      });
      res.cookie('es_access', '', CLEAR_COOKIE);
      res.cookie('es_refresh', '', { ...CLEAR_COOKIE, path: '/api/v1/auth' });
      res.status(200).json(ACK);
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await this.changePasswordService.execute({
        userCredentialId: req.user!.id,
        currentPassword: req.body.currentPassword,
        newPassword: req.body.newPassword,
        keepSessionId: req.user!.sessionId,
      });
      res.status(200).json(ACK);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credential = await this.credentialRepository.findById(req.user!.id);
      if (!credential) {
        res.status(401).json({ error: 'AUTHENTICATION_REQUIRED', message: 'User not found' });
        return;
      }
      res.status(200).json({ user: AuthMapper.toAuthenticatedUserDto(credential) });
    } catch (error) {
      next(error);
    }
  };
}
