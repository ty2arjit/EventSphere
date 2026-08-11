"use client";

import { useEffect, useState } from "react";
import { Search, CalendarDays } from "lucide-react";
import { StaggerList, StaggerItem } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { browseEvents } from "../api/eventClient";
import type { EventBrowseItem } from "../types";
import { BrowseEventCard } from "./BrowseEventCard";

const PAGE_SIZE = 12;

export function BrowseEvents() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [events, setEvents] = useState<EventBrowseItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    setPage(0);
  }, [debouncedQuery]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    browseEvents(
      { q: debouncedQuery || undefined, page, pageSize: PAGE_SIZE },
      { signal: controller.signal },
    ).then((result) => {
      if (result.ok) {
        setEvents((prev) => (page === 0 ? result.data.data : [...prev, ...result.data.data]));
        setTotal(result.data.total);
      }
      setLoading(false);
    });
    return () => controller.abort();
  }, [debouncedQuery, page]);

  const hasMore = events.length < total;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search events by name or category…"
          className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {loading && page === 0 ? (
        <Spinner label="Loading events…" />
      ) : events.length === 0 ? (
        <EmptyState
          icon={CalendarDays}
          message={debouncedQuery ? `No events match "${debouncedQuery}".` : "No events to browse yet."}
        />
      ) : (
        <>
          <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {events.map((e) => (
              <StaggerItem key={e.id}>
                <BrowseEventCard event={e} />
              </StaggerItem>
            ))}
          </StaggerList>
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button variant="outline" onClick={() => setPage((p) => p + 1)} disabled={loading}>
                {loading ? "Loading…" : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
