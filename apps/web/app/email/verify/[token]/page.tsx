"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { confirmEmailVerification } from "@/features/authentication/api/authClient";

type State =
  | { status: "verifying" }
  | { status: "success" }
  | { status: "error"; message: string };

export default function EmailVerifyPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [state, setState] = useState<State>({ status: "verifying" });

  useEffect(() => {
    if (!params.token) return;

    confirmEmailVerification({ token: params.token }).then((result) => {
      if (result.ok) {
        setState({ status: "success" });
        setTimeout(() => router.push("/login"), 3000);
      } else {
        setState({
          status: "error",
          message:
            result.error.code === "VERIFICATION_TOKEN_EXPIRED"
              ? "This verification link has expired. Please request a new one."
              : result.error.code === "VERIFICATION_TOKEN_ALREADY_CONSUMED"
                ? "This email has already been verified."
                : "Verification failed. Please try again.",
        });
      }
    });
  }, [params.token, router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Verification</CardTitle>
        </CardHeader>
        <CardContent>
          {state.status === "verifying" && (
            <p className="text-sm text-muted-foreground">
              Verifying your email…
            </p>
          )}
          {state.status === "success" && (
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950">
              <p className="text-sm font-medium text-green-800 dark:text-green-200">
                Email verified successfully!
              </p>
              <p className="mt-1 text-sm text-green-700 dark:text-green-300">
                Redirecting to login…
              </p>
            </div>
          )}
          {state.status === "error" && (
            <p role="alert" className="text-sm text-destructive">
              {state.message}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
