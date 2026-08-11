"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CalendarDays,
  MapPin,
  Tag,
  Users,
  ClipboardCheck,
  ListChecks,
  Megaphone,
  BarChart3,
  Sparkles,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/ui/Section";
import { Spinner } from "@/components/ui/Spinner";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { ImageUploadField } from "@/components/ui/ImageUploadField";
import { FadeIn } from "@/components/motion/FadeIn";
import { getErrorMessage } from "@/lib/api/errorMessages";
import type { EventResponse } from "../types";
import { getEventBySlug, transitionEvent, updateEvent } from "../api/eventClient";
import { CommitteeDetail } from "@/features/committee";
import { RegistrationPanel } from "@/features/participation";
import { EnrollmentList } from "@/features/participation";
import { CheckInScanner } from "@/features/participation";
import { TaskBoard, CreateTaskForm } from "@/features/volunteer";
import { AnnouncementFeed, CreateAnnouncementForm } from "@/features/announcement";
import { EventDashboardPanel, AIAssistant } from "@/features/analytics";
import { useCurrentUser } from "@/features/authentication/hooks/useCurrentUser";
import { useCanManage } from "@/features/authorization";

const NEXT_TRANSITION: Record<string, { label: string; target: string } | undefined> = {
  Draft: { label: "Publish", target: "Published" },
  Published: { label: "Open Registration", target: "RegistrationOpen" },
  RegistrationOpen: { label: "Close Registration", target: "RegistrationClosed" },
  RegistrationClosed: { label: "Go Live", target: "Live" },
  Live: { label: "Complete", target: "Completed" },
  Completed: { label: "Archive", target: "Archived" },
};

// Distinct per-state hues (not the muted primary/accent tokens used
// elsewhere) — this page benefits from being able to tell Draft from Live
// from Completed at a glance, the way a status board would.
const STATE_BADGES: Record<string, string> = {
  Draft: "bg-slate-500/15 text-slate-600 dark:text-slate-300",
  Published: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  RegistrationOpen: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  Live: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  Completed: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  Cancelled: "bg-rose-500/10 text-rose-500 dark:text-rose-400",
  Archived: "bg-muted text-muted-foreground",
};

const STATE_DOTS: Record<string, string> = {
  Draft: "bg-slate-500",
  Published: "bg-sky-500",
  RegistrationOpen: "bg-emerald-500",
  Live: "bg-rose-500",
  Completed: "bg-violet-500",
  Cancelled: "bg-rose-500",
  Archived: "bg-muted-foreground",
};

export function EventDetail({ slug }: { slug: string }) {
  const [state, setState] = useState<
    | { status: "loading" }
    | { status: "loaded"; event: EventResponse }
    | { status: "error"; message: string }
  >({ status: "loading" });
  const [transitioning, setTransitioning] = useState(false);
  const [taskRefreshKey, setTaskRefreshKey] = useState(0);
  const [announcementRefreshKey, setAnnouncementRefreshKey] = useState(0);
  const [enrollmentRefreshKey, setEnrollmentRefreshKey] = useState(0);
  const { user } = useCurrentUser();

  useEffect(() => {
    const controller = new AbortController();
    getEventBySlug(slug, { signal: controller.signal }).then((result) => {
      if (result.ok) setState({ status: "loaded", event: result.data });
      else setState({ status: "error", message: result.error.message });
    });
    return () => controller.abort();
  }, [slug]);

  const communityId = state.status === "loaded" ? state.event.communityId : null;
  const eventId = state.status === "loaded" ? state.event.id : null;

  // Each section is gated by its own permission — the backend enforces these
  // independently (a CommitteeRole grant might carry task:manage without
  // announcement:manage), so a single shared "isOrganizer" would show
  // controls that fail with 403 for anyone who isn't the community owner.
  const canManageEvent = useCanManage("event:manage", communityId, eventId, user?.id);
  const canManageCommittee = useCanManage("committee:manage", communityId, eventId, user?.id);
  const canManageParticipation = useCanManage("participation:manage", communityId, eventId, user?.id);
  const canManageTasks = useCanManage("task:manage", communityId, eventId, user?.id);
  const canManageAnnouncements = useCanManage("announcement:manage", communityId, eventId, user?.id);

  if (state.status === "loading") return <Spinner label="Loading event…" />;
  if (state.status === "error") return <p className="text-sm text-destructive">{state.message}</p>;

  const { event } = state;
  const nextAction = NEXT_TRANSITION[event.state];
  const badgeClass = STATE_BADGES[event.state] ?? "bg-muted text-muted-foreground";
  const directionsQuery =
    event.mode !== "Online"
      ? [event.location.venue, event.location.address, event.location.city].filter(Boolean).join(", ")
      : "";
  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    description: event.description ?? undefined,
    startDate: event.startDate ?? undefined,
    endDate: event.endDate ?? undefined,
    eventAttendanceMode:
      event.mode === "Online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.mode === "Hybrid"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus:
      event.state === "Cancelled"
        ? "https://schema.org/EventCancelled"
        : "https://schema.org/EventScheduled",
    location:
      event.mode === "Online"
        ? { "@type": "VirtualLocation", url: event.location.onlineUrl ?? undefined }
        : {
            "@type": "Place",
            name: event.location.venue ?? event.name,
            address: [event.location.address, event.location.city].filter(Boolean).join(", ") || undefined,
          },
    image: event.bannerUrl ?? undefined,
  };

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

  async function handleBannerUploaded(bannerUrl: string) {
    const result = await updateEvent(event.id, { bannerUrl });
    if (result.ok) {
      setState({ status: "loaded", event: { ...event, bannerUrl } });
    } else {
      toast.error("Couldn't save the banner. Please try again.");
    }
  }

  return (
    <FadeIn>
      <div className="space-y-6">
        {/* eslint-disable-next-line react/no-danger -- JSON-LD; "<" is escaped below so an event name/description
            can't break out of the script tag (organizer-supplied strings, not fully trusted). */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd).replace(/</g, "\\u003c") }}
        />
        <Breadcrumbs items={[{ label: "Events", href: "/events" }, { label: event.name }]} />
        <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
          {canManageEvent ? (
            <div className="p-4">
              <ImageUploadField
                folder="banners"
                currentUrl={event.bannerUrl}
                onUploaded={handleBannerUploaded}
                shape="wide"
              />
            </div>
          ) : event.bannerUrl ? (
            <div className="relative aspect-[3/1] w-full">
              <Image src={event.bannerUrl} alt={`${event.name} banner`} fill unoptimized className="object-cover" />
            </div>
          ) : null}

          <div className="relative p-6 sm:p-8">
          <div className="pointer-events-none absolute inset-0 bg-mesh opacity-60" />
          <div className="relative space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl font-semibold sm:text-3xl">{event.name}</h1>
                {event.description && (
                  <p className="mt-1.5 max-w-2xl text-muted-foreground">{event.description}</p>
                )}
              </div>
              <span
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ${badgeClass}`}
              >
                <span className={`size-1.5 rounded-full ${STATE_DOTS[event.state] ?? "bg-muted-foreground"}`} />
                {event.state}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                <MapPin className="size-3.5" />
                {event.mode}
                {event.location.venue &&
                  ` · ${event.location.venue}${event.location.city ? `, ${event.location.city}` : ""}`}
              </span>
              {event.startDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                  <CalendarDays className="size-3.5" />
                  {new Date(event.startDate).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              )}
              {event.endDate && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                  <Clock className="size-3.5" />
                  Ends{" "}
                  {new Date(event.endDate).toLocaleString(undefined, {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              )}
              {event.category && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                  <Tag className="size-3.5" />
                  {event.category}
                </span>
              )}
              {directionsQuery && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(directionsQuery)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-primary underline-offset-2 hover:underline"
                >
                  Get directions
                </a>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-secondary-foreground">
                {event.visibility}
              </span>
            </div>

            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {event.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {canManageEvent && (
              <div className="flex gap-2 pt-1">
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
            )}
          </div>
          </div>
        </div>

        <Section icon={Users} title="Committee">
          <CommitteeDetail
            eventId={event.id}
            communityId={event.communityId}
            canManage={canManageCommittee}
          />
        </Section>

        <Section icon={ClipboardCheck} title="Registration & Enrollment">
          <div className="space-y-4">
            <RegistrationPanel
              eventId={event.id}
              isOrganizer={canManageParticipation}
              onEnrolled={() => setEnrollmentRefreshKey((k) => k + 1)}
            />
            <EnrollmentList
              key={enrollmentRefreshKey}
              eventId={event.id}
              isOrganizer={canManageParticipation}
            />
            {canManageParticipation && (
              <CheckInScanner eventId={event.id} sessions={event.sessions} />
            )}
          </div>
        </Section>

        <Section icon={ListChecks} title="Tasks">
          <div className="space-y-4">
            {canManageTasks && (
              <CreateTaskForm
                eventId={event.id}
                onCreated={() => setTaskRefreshKey((k) => k + 1)}
              />
            )}
            <TaskBoard key={taskRefreshKey} eventId={event.id} canManage={canManageTasks} />
          </div>
        </Section>

        <Section icon={Megaphone} title="Announcements">
          <div className="space-y-4">
            {canManageAnnouncements && (
              <CreateAnnouncementForm
                eventId={event.id}
                onCreated={() => setAnnouncementRefreshKey((k) => k + 1)}
              />
            )}
            <AnnouncementFeed
              key={announcementRefreshKey}
              eventId={event.id}
              isOrganizer={canManageAnnouncements}
            />
          </div>
        </Section>

        <Section icon={BarChart3} title="Analytics">
          <EventDashboardPanel eventId={event.id} />
        </Section>

        <Section icon={Sparkles} title="AI Assistant">
          <AIAssistant eventId={event.id} />
        </Section>

        {event.sessions.length > 0 && (
          <Section icon={CalendarDays} title="Sessions">
            <div className="space-y-2.5">
              {event.sessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-xl border border-border bg-background/60 p-4"
                >
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(session.startAt).toLocaleString()}
                      {session.endAt && ` – ${new Date(session.endAt).toLocaleString()}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </FadeIn>
  );
}
