"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listByCommunity, listByEvent, publishAnnouncement } from "../api/announcementClient";
import type { AnnouncementResponse } from "../types";
import { StaggerList } from "@/components/motion/StaggerList";

const PRIORITY_STYLES: Record<string, string> = {
  Urgent: "border-l-red-500 bg-red-50 dark:bg-red-950",
  High: "border-l-orange-500",
  Normal: "border-l-blue-500",
  Low: "border-l-gray-400",
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

  if (loading) return <p className="text-muted-foreground text-sm">Loading announcements...</p>;
  if (announcements.length === 0) return <p className="text-muted-foreground text-sm">No announcements.</p>;

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-lg">Announcements</h3>
      <StaggerList>
        {announcements.map((a) => (
          <div
            key={a.id}
            className={`border-l-4 ${PRIORITY_STYLES[a.priority] ?? ""} border rounded-md p-4 space-y-2`}
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium">{a.title}</h4>
              <div className="flex items-center gap-2">
                {a.isDraft && (
                  <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 px-2 py-0.5 rounded-full">
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
              {a.channels.length > 0 && (
                <span>{a.channels.join(", ")}</span>
              )}
            </div>
            {isOrganizer && a.isDraft && (
              <button
                onClick={() => handlePublish(a.id)}
                className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90"
              >
                Publish
              </button>
            )}
          </div>
        ))}
      </StaggerList>
    </div>
  );
}
