"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { registerProfile } from "@/lib/api/profileClient";
import {
  registerProfileSchema,
  type RegisterProfileFormInput,
  type RegisterProfileFormValues,
} from "@/lib/validation/registerProfileSchema";

/**
 * Interactive registration form — the Client Component boundary for `/profile`.
 *
 * `'use client'` lives here rather than on the page so only this component and
 * its imports enter the client bundle; the surrounding page stays a Server
 * Component (Next.js 16 guidance, and the structure established in Step 3).
 *
 * SCOPE — Step 6 of the frontend plan. Form structure, validation, and API
 * integration are in place. Still deferred:
 *   - Step 7 adds loading, success, and error states
 *
 * Contains no business logic (Constitution Article 29). Validation here is UX
 * only — the backend stays authoritative (convention 11.4).
 */

export function ProfileRegistrationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
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
   * Submits validated, normalised values to the API.
   *
   * `handleSubmit` only invokes this after the Zod schema passes, so the values
   * reaching the client are already validated and normalised — no re-checking
   * here, and no unvalidated input can reach the network.
   *
   * `registerProfile` never throws: transport and HTTP failures come back as
   * `{ ok: false }`. Both branches are handled explicitly (convention 11.5) so
   * the compiler enforces that neither outcome is silently dropped.
   *
   * SCOPE — Step 6 establishes the browser → API → backend round trip only.
   * The branch bodies are intentionally empty: rendering the outcome is Step 7's
   * job, and adding UI here would exceed the approved scope. The request itself
   * is verifiable via network inspection without any UI.
   */
  const onSubmit = async (values: RegisterProfileFormValues): Promise<void> => {
    const result = await registerProfile(values);

    if (result.ok) {
      // Step 7: render the created profile (result.data) in the success panel.
      return;
    }

    // Step 7: map result.error.code to user-facing copy (conventions 11.2, 11.3).
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          // Marks the field invalid for assistive tech and links it to its
          // message, so the error is announced rather than conveyed by colour alone.
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

      <Button type="submit" className="w-full">
        Register
      </Button>
    </form>
  );
}
