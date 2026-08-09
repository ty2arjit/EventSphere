"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { MailCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SuccessCheckmark } from "@/components/motion/SuccessCheckmark";
import { FadeIn } from "@/components/motion/FadeIn";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { register as registerUser, confirmEmailVerificationOtp } from "../api/authClient";
import {
  registerSchema,
  type RegisterFormValues,
} from "../validation/registerSchema";

type Outcome =
  | { status: "idle" }
  | { status: "awaitingOtp"; email: string }
  | { status: "verified" }
  | { status: "error"; message: string };

export function RegisterForm() {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome>({ status: "idle" });
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

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
      setOutcome({ status: "awaitingOtp", email: values.email });
    } else {
      setOutcome({ status: "error", message: getErrorMessage(result.error) });
    }
  }

  async function handleVerifyOtp(email: string) {
    if (!/^\d{6}$/.test(otp)) {
      setOtpError("Enter the 6-digit code from your email.");
      return;
    }
    setOtpError(null);
    setVerifying(true);
    const result = await confirmEmailVerificationOtp({ email, code: otp });
    setVerifying(false);
    if (result.ok) {
      setOutcome({ status: "verified" });
      setTimeout(() => router.push("/login"), 1800);
    } else {
      setOtpError(getErrorMessage(result.error));
    }
  }

  if (outcome.status === "verified") {
    return (
      <FadeIn>
        <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-background/60 p-6">
          <SuccessCheckmark size={56} />
          <h3 className="font-heading font-medium">Email verified</h3>
          <p className="text-center text-sm text-muted-foreground">
            Redirecting you to sign in…
          </p>
        </div>
      </FadeIn>
    );
  }

  if (outcome.status === "awaitingOtp") {
    return (
      <FadeIn>
        <div className="space-y-4 rounded-xl border border-border bg-background/60 p-6">
          <div className="flex flex-col items-center gap-2 text-center">
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MailCheck className="size-5" />
            </span>
            <h3 className="font-heading font-medium">Check your email</h3>
            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to <strong>{outcome.email}</strong>. Enter
              it below to verify your account.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="otp-code">Verification code</Label>
            <Input
              id="otp-code"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleVerifyOtp(outcome.email)}
              placeholder="123456"
              className="text-center text-lg tracking-[0.4em]"
            />
            {otpError && (
              <p role="alert" className="text-sm text-destructive">
                {otpError}
              </p>
            )}
          </div>

          <Button
            className="w-full"
            disabled={verifying || otp.length !== 6}
            onClick={() => handleVerifyOtp(outcome.email)}
          >
            {verifying ? "Verifying…" : "Verify email"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            A verification link was also sent to the same address — either
            works.
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
