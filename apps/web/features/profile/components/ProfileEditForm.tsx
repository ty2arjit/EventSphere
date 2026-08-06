"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { updateProfile } from "../api/profileClient";
import type { ProfileDetails, ProfileResponse } from "../types";
import {
  updateProfileSchema,
  type UpdateProfileFormInput,
  type UpdateProfileFormValues,
} from "../validation/updateProfileSchema";

/**
 * Edit form for bio/headline/institution/department/graduationYear — the
 * fields that map to the backend's single `updateProfile()` aggregate
 * method and its one `PATCH /api/v1/profile/:id` endpoint (Constitution
 * Article 24, one form per use case).
 *
 * Contains no business logic (Article 29); client validation is UX only.
 */

type SubmissionOutcome =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

function toFormDefaults(profile: ProfileDetails): UpdateProfileFormInput {
  return {
    bio: profile.bio ?? "",
    headline: profile.headline ?? "",
    institution: profile.institution ?? "",
    department: profile.department ?? "",
    graduationYear: profile.graduationYear ?? undefined,
  };
}

export function ProfileEditForm({
  profileId,
  initialValues,
  onSuccess,
}: {
  profileId: string;
  initialValues: ProfileDetails;
  onSuccess: (profile: ProfileResponse) => void;
}) {
  const [outcome, setOutcome] = useState<SubmissionOutcome>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdateProfileFormInput, unknown, UpdateProfileFormValues>({
    resolver: zodResolver(updateProfileSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: toFormDefaults(initialValues),
  });

  const onSubmit = async (values: UpdateProfileFormValues): Promise<void> => {
    setOutcome({ status: "idle" });

    const result = await updateProfile(profileId, {
      bio: values.bio || null,
      headline: values.headline || null,
      institution: values.institution || null,
      department: values.department || null,
      graduationYear: values.graduationYear ?? null,
    });

    if (result.ok) {
      setOutcome({ status: "success" });
      onSuccess(result.data);
      return;
    }

    setOutcome({ status: "error", message: getErrorMessage(result.error) });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate aria-busy={isSubmitting}>
      <div className="space-y-2">
        <Label htmlFor="headline">Headline</Label>
        <Input
          id="headline"
          placeholder="e.g. PhD Candidate, Cognitive Science"
          disabled={isSubmitting}
          aria-invalid={errors.headline ? true : undefined}
          {...register("headline")}
        />
        {errors.headline ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.headline.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea
          id="bio"
          rows={3}
          placeholder="A little about you"
          disabled={isSubmitting}
          aria-invalid={errors.bio ? true : undefined}
          {...register("bio")}
        />
        {errors.bio ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.bio.message}
          </p>
        ) : null}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="institution">Institution</Label>
          <Input
            id="institution"
            disabled={isSubmitting}
            aria-invalid={errors.institution ? true : undefined}
            {...register("institution")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input
            id="department"
            disabled={isSubmitting}
            aria-invalid={errors.department ? true : undefined}
            {...register("department")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="graduationYear">Graduation year</Label>
        <Input
          id="graduationYear"
          type="number"
          disabled={isSubmitting}
          aria-invalid={errors.graduationYear ? true : undefined}
          {...register("graduationYear", { valueAsNumber: true })}
        />
        {errors.graduationYear ? (
          <p role="alert" className="text-sm text-destructive">
            {errors.graduationYear.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save profile"}
      </Button>

      <div aria-live="polite" aria-atomic="true">
        {outcome.status === "success" ? (
          <p role="status" className="text-sm text-accent">
            Profile updated.
          </p>
        ) : null}
        {outcome.status === "error" ? (
          <p role="alert" className="text-sm text-destructive">
            {outcome.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
