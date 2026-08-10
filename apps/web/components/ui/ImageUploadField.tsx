"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  getUploadSignature,
  uploadToCloudinary,
  type UploadFolder,
} from "@/features/uploads/api/uploadsClient";

interface ImageUploadFieldProps {
  folder: UploadFolder;
  currentUrl: string | null;
  onUploaded: (url: string) => void;
  shape?: "circle" | "square" | "wide";
}

const SHAPE_CLASS: Record<NonNullable<ImageUploadFieldProps["shape"]>, string> = {
  circle: "size-20 rounded-full",
  square: "size-20 rounded-xl",
  wide: "aspect-[3/1] w-full rounded-xl",
};

/**
 * Signed direct-to-Cloudinary upload. If the backend reports uploads
 * aren't configured yet (503 — no CLOUDINARY_* env vars set), this quietly
 * disables itself rather than showing a broken control; callers should
 * pair it with a plain URL-paste field as the fallback path, same as the
 * rest of this app's avatar/logo fields did before this component existed.
 */
export function ImageUploadField({ folder, currentUrl, onUploaded, shape = "square" }: ImageUploadFieldProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl);
  const [uploading, setUploading] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";

    setUploading(true);
    const sigResult = await getUploadSignature(folder);
    if (!sigResult.ok) {
      setUploading(false);
      if (sigResult.error.status === 503) {
        setUnavailable(true);
      } else {
        toast.error(sigResult.error.message);
      }
      return;
    }

    try {
      const url = await uploadToCloudinary(file, sigResult.data);
      setPreview(url);
      onUploaded(url);
      toast.success("Image uploaded");
    } catch {
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  if (unavailable) {
    return (
      <p className="text-xs text-muted-foreground">
        Direct image upload isn&apos;t set up yet — paste a URL below instead.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={`group relative flex shrink-0 items-center justify-center overflow-hidden border border-dashed border-border bg-muted text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60 ${SHAPE_CLASS[shape]}`}
      >
        {preview ? (
          <Image src={preview} alt="" fill unoptimized className="object-cover" />
        ) : uploading ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Upload className="size-5" />
        )}
        {preview && !uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
            <Upload className="size-5 text-white" />
          </div>
        )}
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
      <p className="text-xs text-muted-foreground">
        {uploading ? "Uploading…" : "Click to upload an image"}
      </p>
    </div>
  );
}
