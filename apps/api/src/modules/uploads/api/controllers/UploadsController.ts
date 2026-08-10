import { Request, Response, NextFunction } from "express";
import { CloudinarySignatureService, UPLOAD_FOLDERS, UploadFolder } from "../../infrastructure/CloudinarySignatureService";

export class UploadsController {
  constructor(private readonly signatureService: CloudinarySignatureService | null) {}

  getSignature = (req: Request, res: Response, next: NextFunction): void => {
    try {
      if (!this.signatureService) {
        res.status(503).json({
          error: "UPLOADS_NOT_CONFIGURED",
          message: "Cloud image upload isn't set up yet — paste a URL instead.",
        });
        return;
      }

      const folder = req.query.folder as string;
      if (!UPLOAD_FOLDERS.includes(folder as UploadFolder)) {
        res.status(400).json({
          error: "VALIDATION_ERROR",
          message: `folder must be one of: ${UPLOAD_FOLDERS.join(", ")}`,
        });
        return;
      }

      const signature = this.signatureService.sign(folder as UploadFolder);
      res.status(200).json(signature);
    } catch (error) {
      next(error);
    }
  };
}
