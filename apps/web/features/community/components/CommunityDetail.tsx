"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getErrorMessage } from "@/lib/api/errorMessages";
import { useCurrentUser } from "@/features/authentication/hooks/useCurrentUser";
import { EventList } from "@/features/events";
import { useCanManage } from "@/features/authorization";
import type { CommunityResponse } from "../types";
import {
  getCommunityBySlug,
  joinCommunity,
  leaveCommunity,
} from "../api/communityClient";

interface CommunityDetailProps {
  slug: string;
}

type State =
  | { status: "loading" }
  | { status: "loaded"; community: CommunityResponse }
  | { status: "error"; message: string };

export function CommunityDetail({ slug }: CommunityDetailProps) {
  const [state, setState] = useState<State>({ status: "loading" });
  const { user } = useCurrentUser();
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getCommunityBySlug(slug, { signal: controller.signal }).then((result) => {
      if (result.ok) {
        setState({ status: "loaded", community: result.data });
      } else {
        setState({ status: "error", message: result.error.message });
      }
    });
    return () => controller.abort();
  }, [slug]);

  const communityId = state.status === "loaded" ? state.community.id : null;
  const canCreateEvent = useCanManage("event:manage", communityId, null, user?.id);

  if (state.status === "loading") {
    return <p className="text-muted-foreground">Loading community…</p>;
  }

  if (state.status === "error") {
    return <p className="text-sm text-destructive">{state.message}</p>;
  }

  const { community } = state;
  const isMember = user
    ? community.members.some((m) => m.userId === user.id)
    : false;
  const isOwner = user?.id === community.ownerId;

  async function handleJoin() {
    setActionLoading(true);
    const result = await joinCommunity(community.id);
    if (result.ok) {
      toast.success("Joined community!");
      setState({ status: "loaded", community: result.data });
    }
    setActionLoading(false);
  }

  async function handleLeave() {
    setActionLoading(true);
    const result = await leaveCommunity(community.id);
    if (result.ok) {
      toast.success("Left community.");
      setState({ status: "loaded", community: result.data });
    }
    setActionLoading(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{community.name}</h1>
        {community.description && (
          <p className="mt-2 text-muted-foreground">{community.description}</p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {community.memberCount} member
          {community.memberCount !== 1 ? "s" : ""}
        </p>
      </div>

      {user && !isMember && (
        <Button onClick={handleJoin} disabled={actionLoading}>
          {actionLoading ? "Joining…" : "Join Community"}
        </Button>
      )}

      {user && isMember && !isOwner && (
        <Button variant="outline" onClick={handleLeave} disabled={actionLoading}>
          {actionLoading ? "Leaving…" : "Leave Community"}
        </Button>
      )}

      {community.positions.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Positions</h2>
          <ul className="mt-2 space-y-2">
            {community.positions.map((pos) => (
              <li key={pos.id} className="rounded border p-3">
                <span className="font-medium">{pos.name}</span>
                {pos.description && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    — {pos.description}
                  </span>
                )}
                {pos.currentHolders.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {pos.currentHolders.length} holder
                    {pos.currentHolders.length !== 1 ? "s" : ""}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {community.members.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-sm text-muted-foreground">
            {community.members.length} active member
            {community.members.length !== 1 ? "s" : ""}
          </p>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Events</h2>
          {canCreateEvent && (
            <Link
              href={`/communities/${slug}/events/new`}
              className="text-sm font-medium text-primary hover:underline"
            >
              + Create Event
            </Link>
          )}
        </div>
        <div className="mt-2">
          <EventList communityId={community.id} />
        </div>
      </div>
    </div>
  );
}
