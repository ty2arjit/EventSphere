"use client";

import type { ReactNode } from "react";
import { Toaster } from "sonner";
import { ThemeProvider } from "./ThemeProvider";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: "border-border bg-card text-card-foreground",
        }}
      />
    </ThemeProvider>
  );
}
