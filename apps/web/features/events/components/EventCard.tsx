import Link from "next/link";
import Image from "next/image";
import { CalendarDays, MapPin, ArrowUpRight } from "lucide-react";
import type { EventListItem } from "../types";

const STATE_BADGES: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Published: "bg-accent/15 text-accent",
  RegistrationOpen: "bg-primary/15 text-primary",
  Live: "bg-destructive/15 text-destructive",
  Completed: "bg-muted text-muted-foreground",
  Cancelled: "bg-destructive/10 text-destructive",
};

export function EventCard({ event }: { event: EventListItem }) {
  const badgeClass = STATE_BADGES[event.state] ?? "bg-muted text-muted-foreground";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-soft-lg"
    >
      {event.bannerUrl && (
        <div className="relative aspect-[3/1] w-full">
          <Image src={event.bannerUrl} alt="" fill unoptimized className="object-cover" />
        </div>
      )}
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate font-heading text-base font-medium">{event.name}</h3>
            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </div>
          {event.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{event.description}</p>
          )}
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3.5" />
              {event.mode}
            </span>
            {event.startDate && (
              <span className="inline-flex items-center gap-1">
                <CalendarDays className="size-3.5" />
                {new Date(event.startDate).toLocaleDateString()}
              </span>
            )}
            <span>
              {event.sessionCount} session{event.sessionCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${badgeClass}`}>
          {event.state}
        </span>
      </div>
    </Link>
  );
}
