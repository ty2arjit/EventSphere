import { v2 as cloudinary } from "cloudinary";

/**
 * Signed direct-upload: the browser uploads straight to Cloudinary using a
 * short-lived signature this service generates, so file bytes never pass
 * through our own API server (Railway's hobby tier has limited memory —
 * proxying multi-MB uploads through a single Node process is exactly the
 * kind of thing that degrades under load) and the Cloudinary API secret
 * never reaches the browser.
 *
 * `folder` is restricted to a fixed allowlist (see UPLOAD_FOLDERS) rather
 * than accepted as free text, so a signed request can't be redirected to
 * write into an arbitrary path in the Cloudinary account.
 */
export const UPLOAD_FOLDERS = ["avatars", "logos", "banners"] as const;
export type UploadFolder = (typeof UPLOAD_FOLDERS)[number];

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: UploadFolder;
}

export class CloudinarySignatureService {
  constructor(
    private readonly cloudName: string,
    private readonly apiKey: string,
    private readonly apiSecret: string,
  ) {}

  /**
   * Cloudinary's dashboard hands out credentials in two equivalent forms:
   * three separate values (CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET), or one
   * combined connection string, CLOUDINARY_URL, shaped like
   * `cloudinary://<api_key>:<api_secret>@<cloud_name>` — the same format
   * Cloudinary's own SDKs auto-detect. Supporting both means whichever one
   * someone copies from the dashboard just works.
   */
  static fromConnectionUrl(url: string): CloudinarySignatureService {
    const match = /^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/.exec(url.trim());
    if (!match) {
      throw new Error(
        'Invalid CLOUDINARY_URL — expected the form cloudinary://<api_key>:<api_secret>@<cloud_name>',
      );
    }
    const [, apiKey, apiSecret, cloudName] = match;
    return new CloudinarySignatureService(cloudName!, apiKey!, apiSecret!);
  }

  sign(folder: UploadFolder): UploadSignature {
    const timestamp = Math.round(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request({ folder, timestamp }, this.apiSecret);
    return { cloudName: this.cloudName, apiKey: this.apiKey, timestamp, signature, folder };
  }
}
