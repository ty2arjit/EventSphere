"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { FadeIn } from "@/components/motion/FadeIn";
import { Users2 } from "lucide-react";
import { getErrorMessage } from "@/lib/api/errorMessages";
import type { CommitteeResponse } from "../types";
import {
  getCommitteeByEventId,
  createCommittee,
  transitionCommittee,
} from "../api/committeeClient";

const NEXT_TRANSITION: Record<string, { label: string; target: string } | undefined> = {
  Planning: { label: "Start Formation", target: "Formation" },
  Formation: { label: "Activate", target: "Active" },
  Active: { label: "Complete", target: "Completed" },
  Completed: { label: "Archive", target: "Archived" },
};

interface CommitteeDetailProps {
  eventId: string;
  communityId: string;
  canManage?: boolean;
}

type State =
  | { status: "loading" }
  | { status: "none" }
  | { status: "loaded"; committee: CommitteeResponse }
  | { status: "error"; message: string };

export function CommitteeDetail({ eventId, communityId, canManage = false }: CommitteeDetailProps) {
  const [state, setState] = useState<State>({ status: "loading" });
  const [acting, setActing] = useState(false);

  function load() {
    getCommitteeByEventId(eventId).then((result) => {
      if (result.ok) setState({ status: "loaded", committee: result.data });
      else if (result.error.status === 404) setState({ status: "none" });
      else setState({ status: "error", message: result.error.message });
    });
  }

  useEffect(() => { load(); }, [eventId]);

  async function handleCreate() {
    setActing(true);
    const result = await createCommittee({ eventId, communityId, name: "Event Committee" });
    if (result.ok) {
      toast.success("Committee created!");
      setState({ status: "loaded", committee: result.data });
    } else {
      toast.error(getErrorMessage(result.error));
    }
    setActing(false);
  }

  async function handleTransition(target: string) {
    if (state.status !== "loaded") return;
    setActing(true);
    const result = await transitionCommittee(state.committee.id, target);
    if (result.ok) {
      toast.success(`Committee transitioned to ${target}`);
      load();
    } else {
      toast.error(getErrorMessage(result.error));
    }
    setActing(false);
  }

  if (state.status === "loading") return <Spinner label="Loading committee…" />;
  if (state.status === "error") return <p className="text-sm text-destructive">{state.message}</p>;

  if (state.status === "none") {
    return (
      <div className="space-y-3">
        <EmptyState icon={Users2} message="No committee set up yet." />
        {canManage && (
          <Button onClick={handleCreate} disabled={acting}>
            {acting ? "Creating…" : "Create Committee"}
          </Button>
        )}
      </div>
    );
  }

  const { committee } = state;
  const nextAction = NEXT_TRANSITION[committee.state];

  return (
    <FadeIn>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{committee.name}</h3>
          <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
            {committee.state}
          </span>
        </div>

        {committee.roles.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-muted-foreground">Roles</h4>
            <div className="mt-1.5 space-y-1.5">
              {committee.roles.map((role) => (
                <div
                  key={role.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background/60 px-3 py-2 text-sm"
                >
                  <span>{role.name}</span>
                  <span className="text-xs text-muted-foreground">{role.activeAssignees} assigned</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {committee.roles.length === 0 && (
          <p className="text-sm text-muted-foreground">No roles defined yet.</p>
        )}

        {canManage && (
          <div className="flex gap-2">
            {nextAction && (
              <Button size="sm" onClick={() => handleTransition(nextAction.target)} disabled={acting}>
                {acting ? "Processing…" : nextAction.label}
              </Button>
            )}
          </div>
        )}
      </div>
    </FadeIn>
  );
}
