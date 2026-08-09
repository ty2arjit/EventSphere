"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { StaggerList, StaggerItem } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import type { CommunityListItem } from "../types";
import { listMyCommunities } from "../api/communityClient";
import { CommunityCard } from "./CommunityCard";

type State =
  | { status: "loading" }
  | { status: "loaded"; communities: CommunityListItem[] }
  | { status: "error"; message: string };

export function CommunityList() {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    listMyCommunities({ signal: controller.signal }).then((result) => {
      if (result.ok) {
        setState({ status: "loaded", communities: result.data.data });
      } else {
        setState({ status: "error", message: result.error.message });
      }
    });
    return () => controller.abort();
  }, []);

  if (state.status === "loading") {
    return <Spinner label="Loading communities…" />;
  }

  if (state.status === "error") {
    return <p className="text-sm text-destructive">{state.message}</p>;
  }

  if (state.communities.length === 0) {
    return (
      <EmptyState icon={Users} message="You haven't joined any communities yet." />
    );
  }

  return (
    <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {state.communities.map((c) => (
        <StaggerItem key={c.id}>
          <CommunityCard community={c} />
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
