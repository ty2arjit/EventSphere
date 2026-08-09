"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Users, Award, CalendarDays, Plus, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { FadeIn } from "@/components/motion/FadeIn";
import { useCurrentUser } from "@/features/authentication/hooks/useCurrentUser";
import { EventList } from "@/features/events";
import { useCanManage, GrantsManager } from "@/features/authorization";
import type { CommunityResponse } from "../types";
import {
  getCommunityBySlug,
  joinCommunity,
  leaveCommunity,
} from "../api/communityClient";
import { InviteMemberForm } from "./InviteMemberForm";

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
    return <Spinner label="Loading community…" />;
  }

  if (state.status === "error") {
    return <p className="text-sm text-destructive">{state.message}</p>;
  }

  const { community } = state;
  const isMember = user
    ? community.members.some((m) => m.userId === user.id)
    : false;
  const isOwner = user?.id === community.ownerId;
  const initial = community.name.trim().charAt(0).toUpperCase() || "C";

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
    <FadeIn>
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-soft sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
          <div className="relative flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary font-heading text-2xl font-medium text-primary-foreground shadow-soft">
                {initial}
              </span>
              <div>
                <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
                  {community.name}
                </h1>
                {community.description && (
                  <p className="mt-1.5 max-w-xl text-muted-foreground">
                    {community.description}
                  </p>
                )}
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
                  <Users className="size-3.5" />
                  {community.memberCount} member
                  {community.memberCount !== 1 ? "s" : ""}
                </div>
              </div>
            </div>

            {user && !isMember && (
              <Button onClick={handleJoin} disabled={actionLoading} className="shrink-0">
                {actionLoading ? "Joining…" : "Join Community"}
              </Button>
            )}
            {user && isMember && !isOwner && (
              <Button
                variant="outline"
                onClick={handleLeave}
                disabled={actionLoading}
                className="shrink-0"
              >
                {actionLoading ? "Leaving…" : "Leave Community"}
              </Button>
            )}
          </div>
        </div>

        {community.positions.length > 0 && (
          <Section icon={Award} title="Positions">
            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {community.positions.map((pos) => (
                <li
                  key={pos.id}
                  className="rounded-xl border border-border bg-background/60 p-4"
                >
                  <span className="font-medium">{pos.name}</span>
                  {pos.description && (
                    <p className="mt-0.5 text-sm text-muted-foreground">
                      {pos.description}
                    </p>
                  )}
                  {pos.currentHolders.length > 0 && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      {pos.currentHolders.length} holder
                      {pos.currentHolders.length !== 1 ? "s" : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {isOwner && (
          <Section icon={ShieldCheck} title="Permissions">
            <GrantsManager
              communityId={community.id}
              positions={community.positions.map((p) => ({ id: p.id, name: p.name }))}
            />
          </Section>
        )}

        <Section icon={Users} title="Members">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {community.members.length} active member
              {community.members.length !== 1 ? "s" : ""}
            </p>
            {isOwner && <InviteMemberForm communityId={community.id} />}
          </div>
        </Section>

        <Section
          icon={CalendarDays}
          title="Events"
          action={
            canCreateEvent && (
              <Link
                href={`/communities/${slug}/events/new`}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium text-primary-foreground shadow-soft transition-opacity hover:opacity-90"
              >
                <Plus className="size-3.5" />
                Create Event
              </Link>
            )
          }
        >
          <EventList communityId={community.id} />
        </Section>
      </div>
    </FadeIn>
  );
}
