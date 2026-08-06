"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { updateAvatar } from "../api/profileClient";
import type { ProfileResponse } from "../types";
import {
  updateAvatarSchema,
  type UpdateAvatarFormInput,
  type UpdateAvatarFormValues,
} from "../validation/updateAvatarSchema";

/**
 * Avatar-only form — kept separate from ProfileEditForm because the backend
 * exposes it as its own endpoint/Application Service (avatars are read by
 * many other bounded contexts, unlike bio/headline/etc.). Avatar is a
 * URL-string Value Object in this pass, so this is a plain text input, not
 * a file upload widget.
 */
type SubmissionOutcome = { status: "idle" } | { status: "success" } | { status: "error"; message: string };

export function AvatarField({
  profileId,
  currentAvatarUrl,
  onSuccess,
}: {
  profileId: string;
  currentAvatarUrl: string | null;
  onSuccess: (profile: ProfileResponse) => void;
}) {
  const [outcome, setOutcome] = useState<SubmissionOutcome>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateAvatarFormInput, unknown, UpdateAvatarFormValues>({
    resolver: zodResolver(updateAvatarSchema),
    mode: "onBlur",
    defaultValues: { avatarUrl: currentAvatarUrl ?? "" },
  });

  const onSubmit = async (values: UpdateAvatarFormValues): Promise<void> => {
    setOutcome({ status: "idle" });

    const result = await updateAvatar(profileId, { avatarUrl: values.avatarUrl });

    if (result.ok) {
      setOutcome({ status: "success" });
      onSuccess(result.data);
      return;
    }

    setOutcome({ status: "error", message: getErrorMessage(result.error) });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-2" noValidate aria-busy={isSubmitting}>
      <Label htmlFor="avatarUrl">Avatar URL</Label>
      <div className="flex gap-2">
        <Input
          id="avatarUrl"
          type="url"
          placeholder="https://example.com/avatar.png"
          disabled={isSubmitting}
          aria-invalid={errors.avatarUrl ? true : undefined}
          {...register("avatarUrl")}
        />
        <Button type="submit" variant="outline" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save"}
        </Button>
      </div>
      {errors.avatarUrl ? (
        <p role="alert" className="text-sm text-destructive">
          {errors.avatarUrl.message}
        </p>
      ) : null}
      {outcome.status === "error" ? (
        <p role="alert" className="text-sm text-destructive">
          {outcome.message}
        </p>
      ) : null}
    </form>
  );
}
