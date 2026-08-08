"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { login } from "../api/authClient";
import { loginSchema, type LoginFormValues } from "../validation/loginSchema";

type Outcome =
  | { status: "idle" }
  | { status: "error"; message: string };

export function LoginForm() {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: LoginFormValues) {
    setOutcome({ status: "idle" });
    const result = await login(values);
    if (result.ok) {
      router.push(`/profile/${result.data.user.id}`);
    } else {
      setOutcome({
        status: "error",
        message:
          result.error.kind === "UNAUTHORIZED"
            ? "Invalid email or password."
            : getErrorMessage(result.error),
      });
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="login-password">Password</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          {...register("password")}
        />
        {errors.password && (
          <p className="text-sm text-destructive">{errors.password.message}</p>
        )}
      </div>

      {outcome.status === "error" && (
        <p role="alert" className="text-sm text-destructive">
          {outcome.message}
        </p>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
