"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listByCommunity, listByEvent, publishAnnouncement } from "../api/announcementClient";
import type { AnnouncementResponse } from "../types";
import { StaggerList, StaggerItem } from "@/components/motion/StaggerList";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Spinner } from "@/components/ui/Spinner";
import { Megaphone } from "lucide-react";

const PRIORITY_STYLES: Record<string, string> = {
  Urgent: "border-l-destructive",
  High: "border-l-accent",
  Normal: "border-l-primary/60",
  Low: "border-l-muted-foreground/40",
};

interface AnnouncementFeedProps {
  communityId?: string;
  eventId?: string;
  isOrganizer?: boolean;
}

export function AnnouncementFeed({ communityId, eventId, isOrganizer = false }: AnnouncementFeedProps) {
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetcher = communityId
      ? listByCommunity(communityId, { signal: controller.signal })
      : eventId
        ? listByEvent(eventId, { signal: controller.signal })
        : Promise.resolve({ ok: true as const, data: { data: [] as AnnouncementResponse[] } });

    fetcher.then((result) => {
      if (result.ok) setAnnouncements(result.data.data);
      setLoading(false);
    });
    return () => controller.abort();
  }, [communityId, eventId]);

  const handlePublish = async (id: string) => {
    const result = await publishAnnouncement(id);
    if (result.ok) {
      setAnnouncements((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, isDraft: false, publishedAt: new Date().toISOString() } : a,
        ),
      );
      toast.success("Announcement published");
    }
  };

  if (loading) return <Spinner label="Loading announcements…" />;
  if (announcements.length === 0) {
    return <EmptyState icon={Megaphone} message="No announcements." />;
  }

  return (
    <StaggerList className="space-y-3">
      {announcements.map((a) => (
        <StaggerItem key={a.id}>
          <div
            className={`space-y-2 rounded-lg border border-l-4 border-border bg-background/60 p-4 shadow-soft ${PRIORITY_STYLES[a.priority] ?? ""}`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{a.title}</h4>
              <div className="flex items-center gap-2">
                {a.isDraft && (
                  <span className="rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
                    Draft
                  </span>
                )}
                <span className="text-xs text-muted-foreground">{a.priority}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{a.body}</p>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {a.publishedAt
                  ? `Published ${new Date(a.publishedAt).toLocaleDateString()}`
                  : `Created ${new Date(a.createdAt).toLocaleDateString()}`}
              </span>
              {a.channels.length > 0 && <span>{a.channels.join(", ")}</span>}
            </div>
            {isOrganizer && a.isDraft && (
              <Button size="sm" onClick={() => handlePublish(a.id)}>
                Publish
              </Button>
            )}
          </div>
        </StaggerItem>
      ))}
    </StaggerList>
  );
}
