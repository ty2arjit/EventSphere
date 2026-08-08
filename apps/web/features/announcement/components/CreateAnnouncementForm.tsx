"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createAnnouncement } from "../api/announcementClient";

interface CreateAnnouncementFormProps {
  communityId?: string;
  eventId?: string;
  onCreated?: () => void;
}

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
    <form onSubmit={handleSubmit} className="space-y-3 border rounded-lg p-4">
      <h4 className="font-semibold">New Announcement</h4>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
        className="w-full px-3 py-2 border rounded-md"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Message"
        required
        rows={3}
        className="w-full px-3 py-2 border rounded-md"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="w-full px-3 py-2 border rounded-md"
      >
        <option value="Low">Low</option>
        <option value="Normal">Normal</option>
        <option value="High">High</option>
        <option value="Urgent">Urgent</option>
      </select>
      <button
        type="submit"
        disabled={submitting || !title.trim() || !body.trim()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create Announcement"}
      </button>
    </form>
  );
}
