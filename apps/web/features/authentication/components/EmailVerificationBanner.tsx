"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { requestEmailVerification } from "../api/authClient";

export function EmailVerificationBanner() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  async function handleResend() {
    setSending(true);
    const result = await requestEmailVerification();
    setSending(false);
    if (result.ok) {
      setSent(true);
    }
  }

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
      <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
        Your email is not verified.
      </p>
      <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
        {sent
          ? "Verification email sent. Check your inbox."
          : "Please verify your email to access all features."}
      </p>
      {!sent && (
        <Button
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={sending}
          onClick={handleResend}
        >
          {sending ? "Sending…" : "Resend verification email"}
        </Button>
      )}
    </div>
  );
}
