"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Mail, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { createInvitation } from "../api/communityClient";

interface InviteMemberFormProps {
  communityId: string;
}

const inputClass =
  "flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function InviteMemberForm({ communityId }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleInvite() {
    if (!email.trim()) return;
    setSubmitting(true);
    const result = await createInvitation(communityId, { email: email.trim() });
    setSubmitting(false);
    if (result.ok) {
      const link = `${window.location.origin}/invitations/${communityId}/${result.data.invitationId}`;
      setInviteLink(link);
      setEmail("");
      toast.success("Invitation created");
    } else {
      toast.error(getErrorMessage(result.error));
    }
  }

  async function handleCopy() {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <Mail className="size-4" />
        Invite by email
      </div>
      <p className="text-xs text-muted-foreground">
        No email provider is connected yet, so this generates a link you share yourself instead of one that gets emailed automatically.
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleInvite()}
          placeholder="friend@example.com"
          className={inputClass}
        />
        <Button onClick={handleInvite} disabled={submitting || !email.trim()}>
          {submitting ? "Creating…" : "Invite"}
        </Button>
      </div>

      {inviteLink && (
        <div className="flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-xs">
          <span className="flex-1 truncate font-mono">{inviteLink}</span>
          <button
            onClick={handleCopy}
            className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-1 font-medium text-primary hover:bg-primary/20"
          >
            {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
    </div>
  );
}
