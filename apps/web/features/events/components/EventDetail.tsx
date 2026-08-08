"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { FadeIn } from "@/components/motion/FadeIn";
import { getErrorMessage } from "@/lib/api/errorMessages";
import type { EventResponse } from "../types";
import { getEventBySlug, transitionEvent } from "../api/eventClient";
import { CommitteeDetail } from "@/features/committee";
import { RegistrationPanel } from "@/features/participation";
import { EnrollmentList } from "@/features/participation";
import { TaskBoard } from "@/features/volunteer";
import { AnnouncementFeed } from "@/features/announcement";
import { EventDashboardPanel, AIAssistant } from "@/features/analytics";

const NEXT_TRANSITION: Record<string, { label: string; target: string } | undefined> = {
  Draft: { label: "Publish", target: "Published" },
  Published: { label: "Open Registration", target: "RegistrationOpen" },
  RegistrationOpen: { label: "Close Registration", target: "RegistrationClosed" },
  RegistrationClosed: { label: "Go Live", target: "Live" },
  Live: { label: "Complete", target: "Completed" },
  Completed: { label: "Archive", target: "Archived" },
};

export function EventDetail({ slug }: { slug: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "loaded"; event: EventResponse }
    | { status: "error"; message: string }
  >({ status: "loading" });
  const [transitioning, setTransitioning] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    getEventBySlug(slug, { signal: controller.signal }).then((result) => {
      if (result.ok) setState({ status: "loaded", event: result.data });
      else setState({ status: "error", message: result.error.message });
    });
    return () => controller.abort();
  }, [slug]);

  if (state.status === "loading") return <p className="text-muted-foreground">Loading event…</p>;
  if (state.status === "error") return <p className="text-sm text-destructive">{state.message}</p>;

  const { event } = state;
  const nextAction = NEXT_TRANSITION[event.state];

  async function handleTransition(target: string) {
    setTransitioning(true);
    const result = await transitionEvent(event.id, target);
    if (result.ok) {
      toast.success(`Event transitioned to ${target}`);
      const refreshed = await getEventBySlug(slug);
      if (refreshed.ok) setState({ status: "loaded", event: refreshed.data });
    } else {
      toast.error(getErrorMessage(result.error));
    }
    setTransitioning(false);
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{event.name}</h1>
            {event.description && (
              <p className="mt-2 text-muted-foreground">{event.description}</p>
            )}
          </div>
          <span className="shrink-0 rounded-full border px-3 py-1 text-sm font-medium">
            {event.state}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Mode:</span> {event.mode}
          </div>
          <div>
            <span className="font-medium">Visibility:</span> {event.visibility}
          </div>
          {event.startDate && (
            <div>
              <span className="font-medium">Starts:</span>{" "}
              {new Date(event.startDate).toLocaleString()}
            </div>
          )}
          {event.endDate && (
            <div>
              <span className="font-medium">Ends:</span>{" "}
              {new Date(event.endDate).toLocaleString()}
            </div>
          )}
          {event.location.venue && (
            <div className="col-span-2">
              <span className="font-medium">Venue:</span> {event.location.venue}
              {event.location.city && `, ${event.location.city}`}
            </div>
          )}
          {event.category && (
            <div>
              <span className="font-medium">Category:</span> {event.category}
            </div>
          )}
        </div>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {event.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {nextAction && (
            <Button onClick={() => handleTransition(nextAction.target)} disabled={transitioning}>
              {transitioning ? "Processing…" : nextAction.label}
            </Button>
          )}
          {(event.state === "Draft" || event.state === "Published") && (
            <Button
              variant="outline"
              onClick={() => handleTransition("Cancelled")}
              disabled={transitioning}
            >
              Cancel Event
            </Button>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold">Committee</h2>
          <div className="mt-2">
            <CommitteeDetail eventId={event.id} communityId={event.communityId} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Registration & Enrollment</h2>
          <div className="mt-2 space-y-4">
            <RegistrationPanel eventId={event.id} isOrganizer />
            <EnrollmentList eventId={event.id} isOrganizer />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold">Tasks</h2>
          <div className="mt-2">
            <TaskBoard eventId={event.id} />
          </div>
        </div>

        <div>
          <AnnouncementFeed eventId={event.id} isOrganizer />
        </div>

        <div>
          <EventDashboardPanel eventId={event.id} />
        </div>

        <div>
          <AIAssistant eventId={event.id} />
        </div>

        {event.sessions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold">Sessions</h2>
            <div className="mt-2 space-y-2">
              {event.sessions.map((session) => (
                <div key={session.id} className="rounded border p-3">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{session.title}</span>
                    <span className="text-xs text-muted-foreground">{session.state}</span>
                  </div>
                  {session.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{session.description}</p>
                  )}
                  {session.speaker && (
                    <p className="text-sm">Speaker: {session.speaker}</p>
                  )}
                  {session.startAt && (
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.startAt).toLocaleString()}
                      {session.endAt && ` – ${new Date(session.endAt).toLocaleString()}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </FadeIn>
  );
}
