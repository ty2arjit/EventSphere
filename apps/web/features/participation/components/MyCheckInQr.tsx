"use client";

import { useState } from "react";
import Image from "next/image";
import { QrCode, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/Spinner";
import { getCheckInQr } from "../api/participationClient";

interface MyCheckInQrProps {
  enrollmentId: string;
}

type State =
  | { status: "closed" }
  | { status: "loading" }
  | { status: "loaded"; qrCodeDataUrl: string; expiresAt: string }
  | { status: "error"; message: string };

export function MyCheckInQr({ enrollmentId }: MyCheckInQrProps) {
  const [state, setState] = useState<State>({ status: "closed" });

  async function open() {
    setState({ status: "loading" });
    const result = await getCheckInQr(enrollmentId);
    if (result.ok) {
      setState({ status: "loaded", qrCodeDataUrl: result.data.qrCodeDataUrl, expiresAt: result.data.expiresAt });
    } else {
      setState({ status: "error", message: result.error.message });
    }
  }

  if (state.status === "closed") {
    return (
      <button
        onClick={open}
        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary hover:bg-primary/20"
      >
        <QrCode className="size-3.5" />
        Show QR
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <div className="relative w-full max-w-xs rounded-2xl border border-border bg-card p-6 text-center shadow-soft-lg">
        <button
          onClick={() => setState({ status: "closed" })}
          className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground hover:bg-muted"
          aria-label="Close"
        >
          <X className="size-4" />
        </button>

        <h3 className="font-heading text-base font-medium">Your check-in code</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Show this to an organizer at the door.
        </p>

        <div className="mt-4 flex justify-center">
          {state.status === "loading" && <Spinner label="Generating…" />}
          {state.status === "error" && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          {state.status === "loaded" && (
            <Image
              src={state.qrCodeDataUrl}
              alt="Check-in QR code"
              width={220}
              height={220}
              unoptimized
              className="rounded-lg border border-border"
            />
          )}
        </div>

        {state.status === "loaded" && (
          <p className="mt-3 text-xs text-muted-foreground">
            Valid until {new Date(state.expiresAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}
          </p>
        )}

        <Button variant="outline" className="mt-4 w-full" onClick={() => setState({ status: "closed" })}>
          Close
        </Button>
      </div>
    </div>
  );
}
