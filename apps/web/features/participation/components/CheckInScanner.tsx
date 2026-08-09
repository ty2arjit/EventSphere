"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { checkInByQr } from "../api/participationClient";
import { getErrorMessage } from "@/lib/api/errorMessages";

interface Session {
  id: string;
  title: string;
}

interface CheckInScannerProps {
  eventId: string;
  sessions: Session[];
}

/**
 * Organizer-facing check-in. There's no camera-based scanning here — the
 * input just accepts whatever text lands in it, which is exactly how a
 * USB/Bluetooth barcode-scanner "gun" works (they type the decoded string
 * into whatever field has focus) and also works for a participant's phone
 * camera decoding the QR and the organizer pasting the result. Keeps the
 * feature fully functional without needing camera permissions wired up.
 */
export function CheckInScanner({ eventId, sessions }: CheckInScannerProps) {
  const [sessionId, setSessionId] = useState(sessions[0]?.id ?? "");
  const [token, setToken] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit() {
    if (!token.trim() || !sessionId) return;
    setSubmitting(true);
    const result = await checkInByQr({ token: token.trim(), eventId, sessionId });
    setSubmitting(false);
    setToken("");
    inputRef.current?.focus();
    if (result.ok) {
      toast.success("Checked in!");
    } else {
      toast.error(getErrorMessage(result.error));
    }
  }

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Add a session to this event before checking participants in.
      </p>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <ScanLine className="size-4" />
        Check-in scanner
      </div>

      <select
        value={sessionId}
        onChange={(e) => setSessionId(e.target.value)}
        className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {sessions.map((s) => (
          <option key={s.id} value={s.id}>
            {s.title}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Scan or paste check-in code…"
          autoFocus
          className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
        <Button onClick={handleSubmit} disabled={submitting || !token.trim()}>
          {submitting ? "Checking in…" : "Check in"}
        </Button>
      </div>
    </div>
  );
}
