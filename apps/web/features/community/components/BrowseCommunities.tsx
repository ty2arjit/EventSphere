"use client";

import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import { StaggerList, StaggerItem } from "@/components/motion/StaggerList";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Button } from "@/components/ui/button";
import { browseCommunities } from "../api/communityClient";
import type { CommunityListItem } from "../types";
import { CommunityCard } from "./CommunityCard";

const PAGE_SIZE = 12;

export function BrowseCommunities() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [communities, setCommunities] = useState<CommunityListItem[]>([]);
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
    browseCommunities(
      { q: debouncedQuery || undefined, page, pageSize: PAGE_SIZE },
      { signal: controller.signal },
    ).then((result) => {
      if (result.ok) {
        setCommunities((prev) => (page === 0 ? result.data.data : [...prev, ...result.data.data]));
        setTotal(result.data.total);
      }
      setLoading(false);
    });
    return () => controller.abort();
  }, [debouncedQuery, page]);

  const hasMore = communities.length < total;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search communities by name…"
          className="w-full rounded-full border border-border bg-background py-2.5 pl-10 pr-4 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>

      {loading && page === 0 ? (
        <Spinner label="Loading communities…" />
      ) : communities.length === 0 ? (
        <EmptyState
          icon={Users}
          message={debouncedQuery ? `No communities match "${debouncedQuery}".` : "No communities to browse yet."}
        />
      ) : (
        <>
          <StaggerList className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {communities.map((c) => (
              <StaggerItem key={c.id}>
                <CommunityCard community={c} />
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
