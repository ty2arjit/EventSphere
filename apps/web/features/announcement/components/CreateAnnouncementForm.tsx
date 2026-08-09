"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createAnnouncement } from "../api/announcementClient";
import { Button } from "@/components/ui/button";

interface CreateAnnouncementFormProps {
  communityId?: string;
  eventId?: string;
  onCreated?: () => void;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CreateAnnouncementForm({ communityId, eventId, onCreated }: CreateAnnouncementFormProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [priority, setPriority] = useState("Normal");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !body.trim()) return;
    setSubmitting(true);
    const result = await createAnnouncement({
      title,
      body,
      priority,
      channels: ["InApp"],
      communityId,
      eventId,
    });
    if (result.ok) {
      toast.success("Announcement created");
      setTitle("");
      setBody("");
      onCreated?.();
    } else {
      toast.error("Failed to create announcement");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
      <h4 className="text-sm font-medium text-muted-foreground">New Announcement</h4>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
        className={inputClass}
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message"
        required
        rows={3}
        className={inputClass}
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
        <option value="Low">Low</option>
        <option value="Normal">Normal</option>
        <option value="High">High</option>
        <option value="Urgent">Urgent</option>
      </select>
      <Button type="submit" disabled={submitting || !title.trim() || !body.trim()}>
        {submitting ? "Creating…" : "Create Announcement"}
      </Button>
    </form>
  );
}
