import Link from "next/link";
import type { EventListItem } from "../types";

const STATE_BADGES: Record<string, string> = {
  Draft: "bg-muted text-muted-foreground",
  Published: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  RegistrationOpen: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  Live: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  Completed: "bg-muted text-muted-foreground",
  Cancelled: "bg-destructive/10 text-destructive",
};

export function EventCard({ event }: { event: EventListItem }) {
  const badgeClass = STATE_BADGES[event.state] ?? "bg-muted text-muted-foreground";

  return (
    <Link
      href={`/events/${event.slug}`}
      className="block rounded-lg border p-4 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold truncate">{event.name}</h3>
          {event.description && (
            <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{event.description}</p>
          )}
          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <span>{event.mode}</span>
            {event.startDate && (
              <>
                <span>·</span>
                <span>{new Date(event.startDate).toLocaleDateString()}</span>
              </>
            )}
            <span>·</span>
            <span>{event.sessionCount} session{event.sessionCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
          {event.state}
        </span>
      </div>
    </Link>
  );
}
