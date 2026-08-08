"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SuccessCheckmark } from "@/components/motion/SuccessCheckmark";
import { FadeIn } from "@/components/motion/FadeIn";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { register as registerUser } from "../api/authClient";
import {
  registerSchema,
  type RegisterFormValues,
} from "../validation/registerSchema";

type Outcome =
  | { status: "idle" }
  | { status: "success" }
  | { status: "error"; message: string };

export function RegisterForm() {
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: "", name: "", password: "" },
  });

  async function onSubmit(values: RegisterFormValues) {
    setOutcome({ status: "idle" });
    const result = await registerUser(values);
    if (result.ok) {
      setOutcome({ status: "success" });
    } else {
      setOutcome({ status: "error", message: getErrorMessage(result.error) });
    }
  }

  if (outcome.status === "success") {
    return (
      <FadeIn>
        <div className="flex flex-col items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-6 dark:border-green-800 dark:bg-green-950">
          <SuccessCheckmark size={56} />
          <h3 className="font-medium text-green-800 dark:text-green-200">
            Check your email
          </h3>
          <p className="text-center text-sm text-green-700 dark:text-green-300">
            We sent a verification link to your email address. Click the link to
            complete your registration.
          </p>
        </div>
      </FadeIn>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-name">Name</Label>
        <Input
          id="register-name"
          type="text"
          autoComplete="name"
          {...register("name")}
        />
        {errors.name && (
          <p className="text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
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
        {isSubmitting ? "Creating account…" : "Create account"}
      </Button>
    </form>
  );
}
