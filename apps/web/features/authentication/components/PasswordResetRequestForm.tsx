"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { requestPasswordReset } from "../api/authClient";
import {
  requestPasswordResetSchema,
  type RequestPasswordResetFormValues,
} from "../validation/passwordResetSchema";

type Outcome =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export function PasswordResetRequestForm() {
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetFormValues>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: RequestPasswordResetFormValues) {
    setOutcome({ status: "idle" });
    const result = await requestPasswordReset(values);
    if (result.ok) {
      setOutcome({ status: "success" });
    } else {
      setOutcome({ status: "error", message: getErrorMessage(result.error) });
    }
  }

  if (outcome.status === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
        <h3 className="font-medium text-green-800 dark:text-green-200">
          Check your email
        </h3>
        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
          If an account exists with that email, we sent a password reset link.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">Email</Label>
        <Input
          id="reset-email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      {outcome.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {outcome.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send reset link"}
      </Button>
    </form>
  );
}
