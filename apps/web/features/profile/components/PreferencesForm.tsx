"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { updatePreferences } from "../api/profileClient";
import type { ProfilePreferences, ProfileResponse } from "../types";
import {
  updatePreferencesSchema,
  type UpdatePreferencesFormInput,
  type UpdatePreferencesFormValues,
} from "../validation/updatePreferencesSchema";

type SubmissionOutcome = { status: "idle" } | { status: "success" } | { status: "error"; message: string };

const THEME_OPTIONS = [
  { value: "system", label: "System" },
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
] as const;

export function PreferencesForm({
  profileId,
  initialValues,
  onSuccess,
}: {
  profileId: string;
  initialValues: ProfilePreferences;
  onSuccess: (profile: ProfileResponse) => void;
}) {
  const [outcome, setOutcome] = useState<SubmissionOutcome>({ status: "idle" });

  const {
    control,
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<UpdatePreferencesFormInput, unknown, UpdatePreferencesFormValues>({
    resolver: zodResolver(updatePreferencesSchema),
    defaultValues: {
      language: initialValues.language,
      timezone: initialValues.timezone,
      theme: initialValues.theme,
      notifyByEmail: initialValues.notifyByEmail,
      notifyInApp: initialValues.notifyInApp,
    },
  });

  const onSubmit = async (values: UpdatePreferencesFormValues): Promise<void> => {
    setOutcome({ status: "idle" });

    const result = await updatePreferences(profileId, values);

    if (result.ok) {
      setOutcome({ status: "success" });
      onSuccess(result.data);
      return;
    }

    setOutcome({ status: "error", message: getErrorMessage(result.error) });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" aria-busy={isSubmitting}>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="language">Language</Label>
          <input
            id="language"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            disabled={isSubmitting}
            {...register("language")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <input
            id="timezone"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm dark:bg-input/30"
            disabled={isSubmitting}
            {...register("timezone")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="theme">Theme</Label>
        <Controller
          control={control}
          name="theme"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange} disabled={isSubmitting}>
              <SelectTrigger id="theme">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEME_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="notifyByEmail"
            render={({ field }) => (
              <Checkbox
                id="notifyByEmail"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
          <Label htmlFor="notifyByEmail" className="font-normal">
            Email notifications
          </Label>
        </div>
        <div className="flex items-center gap-2">
          <Controller
            control={control}
            name="notifyInApp"
            render={({ field }) => (
              <Checkbox
                id="notifyInApp"
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={isSubmitting}
              />
            )}
          />
          <Label htmlFor="notifyInApp" className="font-normal">
            In-app notifications
          </Label>
        </div>
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : "Save preferences"}
      </Button>

      <div aria-live="polite" aria-atomic="true">
        {outcome.status === "success" ? (
          <p role="status" className="text-sm text-accent">
            Preferences updated.
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
