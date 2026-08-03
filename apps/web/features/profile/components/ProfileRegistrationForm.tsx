"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { registerProfile } from "../api/profileClient";
import type { ProfileResponse } from "../types";
import {
  registerProfileSchema,
  type RegisterProfileFormInput,
  type RegisterProfileFormValues,
} from "../validation/registerProfileSchema";

/**
 * Interactive registration form — the Client Component boundary for `/profile`.
 *
 * `'use client'` lives here rather than on the page so only this component and
 * its imports enter the client bundle; the surrounding page stays a Server
 * Component (Next.js 16 guidance, and the structure established in Step 3).
 *
 * SCOPE — Step 7 of the frontend plan: form structure, validation, API
 * integration, and outcome presentation are all in place.
 *
 * Contains no business logic (Constitution Article 29). Client validation is UX
 * only — the backend stays authoritative (convention 11.4).
 */

/** Copy for backend error codes this specific form can produce. */
const REGISTRATION_ERROR_COPY: Readonly<Record<string, string>> = {
  EMAIL_ALREADY_REGISTERED: "That email is already registered.",
};

/**
 * Outcome of the most recent submission.
 *
 * A discriminated union rather than separate `error`/`profile`/`isDone` flags,
 * so contradictory states (both a success and an error showing at once) are
 * unrepresentable rather than merely avoided by convention.
 */
type SubmissionOutcome =
  | { status: "idle" }
  | { status: "success"; profile: ProfileResponse }
  | { status: "error"; message: string };

export function ProfileRegistrationForm() {
  const [outcome, setOutcome] = useState<SubmissionOutcome>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterProfileFormInput, unknown, RegisterProfileFormValues>({
    resolver: zodResolver(registerProfileSchema),
    // Validate on blur rather than on every keystroke: errors surface once the
    // user leaves a field instead of scolding them mid-typing, then clear as
    // soon as they correct it.
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: { email: "", name: "" },
  });

  /**
   * Submits validated, normalised values to the API and records the outcome.
   *
   * `handleSubmit` only invokes this after the Zod schema passes, so no
   * unvalidated input can reach the network. `registerProfile` never throws —
   * transport and HTTP failures come back as `{ ok: false }` — and both branches
   * are handled explicitly (convention 11.5).
   *
   * Loading state is derived from RHF's `isSubmitting` rather than tracked
   * separately: because this handler is async, RHF holds `isSubmitting` true
   * until the returned promise settles, so the flag cannot drift out of sync
   * with the actual request.
   */
  const onSubmit = async (values: RegisterProfileFormValues): Promise<void> => {
    // Clear any previous outcome so a stale success/error can't sit on screen
    // while a new request is in flight.
    setOutcome({ status: "idle" });

    const result = await registerProfile(values);

    if (result.ok) {
      setOutcome({ status: "success", profile: result.data });
      return;
    }

    setOutcome({
      status: "error",
      message: getErrorMessage(result.error, REGISTRATION_ERROR_COPY),
    });
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
        aria-busy={isSubmitting}
      >
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            // Disabled while in flight to prevent edits mid-request and to make
            // the pending state perceivable without relying on colour alone.
            disabled={isSubmitting}
            // Marks the field invalid for assistive tech and links it to its
            // message, so the error is announced rather than conveyed visually only.
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          {errors.email ? (
            <p id="email-error" role="alert" className="text-sm text-destructive">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            placeholder="Your name"
            disabled={isSubmitting}
            aria-invalid={errors.name ? true : undefined}
            aria-describedby={errors.name ? "name-error" : undefined}
            {...register("name")}
          />
          {errors.name ? (
            <p id="name-error" role="alert" className="text-sm text-destructive">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        {/* Disabling during flight also guards against double submission, which
            would otherwise produce a spurious duplicate-email conflict. */}
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Registering…" : "Register"}
        </Button>
      </form>

      {/*
        Both panels live in a single always-mounted live region. Screen readers
        only announce changes inside a region that already exists, so mounting
        the region conditionally would silently drop the announcement.
        `polite` waits for a pause rather than interrupting; the error panel
        additionally carries role="alert" for immediacy.
      */}
      <div aria-live="polite" aria-atomic="true">
        {outcome.status === "success" ? (
          <div
            role="status"
            className="rounded-lg border border-border bg-muted/50 p-4 text-sm"
          >
            <p className="font-medium">Profile registered</p>
            <dl className="mt-2 space-y-1 text-muted-foreground">
              <div className="flex gap-2">
                <dt className="font-medium">Name:</dt>
                <dd>{outcome.profile.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium">Email:</dt>
                <dd>{outcome.profile.email}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium">ID:</dt>
                <dd className="font-mono text-xs break-all">{outcome.profile.id}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="font-medium">Created:</dt>
                <dd>{outcome.profile.createdAt}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        {outcome.status === "error" ? (
          <div
            role="alert"
            className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive"
          >
            {outcome.message}
          </div>
        ) : null}
      </div>
    </div>
  );
}
