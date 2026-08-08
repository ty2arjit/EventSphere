"use client";

import { useEffect, useState } from "react";
import { StaggerList, StaggerItem } from "@/components/motion/StaggerList";
import type { EventListItem } from "../types";
import { listEventsByCommunity } from "../api/eventClient";
import { EventCard } from "./EventCard";

interface EventListProps {
  communityId: string;
}

type State =
  | { status: "loading" }
  | { status: "loaded"; events: EventListItem[] }
  | { status: "error"; message: string };

export function EventList({ communityId }: EventListProps) {
  const [state, setState] = useState<State>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    listEventsByCommunity(communityId, { signal: controller.signal }).then((result) => {
      if (result.ok) {
        setState({ status: "loaded", events: result.data.data });
      } else {
        setState({ status: "error", message: result.error.message });
      }
    });
    return () => controller.abort();
  }, [communityId]);

  if (state.status === "loading") return <p className="text-muted-foreground">Loading events…</p>;
  if (state.status === "error") return <p className="text-sm text-destructive">{state.message}</p>;
  if (state.events.length === 0) return <p className="text-muted-foreground">No events yet.</p>;

  return (
    <StaggerList className="space-y-3">
      {state.events.map((e) => (
        <StaggerItem key={e.id}>
          <EventCard event={e} />
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
