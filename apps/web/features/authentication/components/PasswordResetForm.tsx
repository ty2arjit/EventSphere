"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { completePasswordReset } from "../api/authClient";
import {
  completePasswordResetSchema,
  type CompletePasswordResetFormValues,
} from "../validation/passwordResetSchema";

type Outcome =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export function PasswordResetForm({ token }: { token: string }) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CompletePasswordResetFormValues>({
    resolver: zodResolver(completePasswordResetSchema),
    defaultValues: { password: "" },
  });

  async function onSubmit(values: CompletePasswordResetFormValues) {
    setOutcome({ status: "idle" });
    const result = await completePasswordReset({
      token,
      password: values.password,
    });
    if (result.ok) {
      setOutcome({ status: "success" });
      setTimeout(() => router.push("/login"), 2000);
    } else {
      setOutcome({ status: "error", message: getErrorMessage(result.error) });
    }
  }

  if (outcome.status === "success") {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
        <h3 className="font-medium text-green-800 dark:text-green-200">
          Password reset
        </h3>
        <p className="mt-1 text-sm text-green-700 dark:text-green-300">
          Your password has been updated. Redirecting to login…
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="new-password">New password</Label>
        <Input
          id="new-password"
          type="password"
          autoComplete="new-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
        <p className="text-xs text-muted-foreground">
          At least 12 characters, one letter, one digit.
        </p>
      </div>

      {outcome.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {outcome.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Resetting…" : "Reset password"}
      </Button>
    </form>
  );
}
