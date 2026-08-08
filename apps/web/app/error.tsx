"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-sm font-medium text-destructive">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight">Unexpected error</h1>
      <p className="mt-3 max-w-md text-muted-foreground">
        This page ran into a problem. You can try again, or head back to the homepage.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <a
          href="/"
          className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Back to home
        </a>
      </div>
    </div>
  );
}
