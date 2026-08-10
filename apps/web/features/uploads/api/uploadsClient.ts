import { request } from "@/lib/api/http";
import type { ApiResult } from "@/lib/api/types";

export type UploadFolder = "avatars" | "logos" | "banners";

export interface UploadSignature {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  signature: string;
  folder: UploadFolder;
}

export function getUploadSignature(
  folder: UploadFolder,
  options: { signal?: AbortSignal } = {},
): Promise<ApiResult<UploadSignature>> {
  return request<UploadSignature>(`/api/v1/uploads/signature?folder=${folder}`, {
    signal: options.signal,
  });
}

/**
 * Uploads directly to Cloudinary using a short-lived signature from our
 * backend — the file never passes through our own API server. Not routed
 * through the shared `request()` helper since it targets a different
 * origin (api.cloudinary.com) entirely, with a different auth model
 * (signature in the form body, not our session cookie).
 */
export async function uploadToCloudinary(file: File, sig: UploadSignature): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("api_key", sig.apiKey);
  formData.append("timestamp", String(sig.timestamp));
  formData.append("signature", sig.signature);
  formData.append("folder", sig.folder);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    throw new Error("Image upload failed. Please try again.");
  }

  const data = await res.json();
  return data.secure_url as string;
}
