"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createTask } from "../api/volunteerClient";
import { Button } from "@/components/ui/button";

interface CreateTaskFormProps {
  eventId: string;
  onCreated?: () => void;
}

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export function CreateTaskForm({ eventId, onCreated }: CreateTaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    const result = await createTask({ eventId, title, description, priority });
    if (result.ok) {
      toast.success("Task created");
      setTitle("");
      setDescription("");
      onCreated?.();
    } else {
      toast.error("Failed to create task");
    }
    setSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-background/60 p-4">
      <h4 className="text-sm font-medium text-muted-foreground">New Task</h4>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
        className={inputClass}
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className={inputClass}
      />
      <select value={priority} onChange={(e) => setPriority(e.target.value)} className={inputClass}>
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Critical">Critical</option>
      </select>
      <Button type="submit" disabled={submitting || !title.trim()}>
        {submitting ? "Creating…" : "Create Task"}
      </Button>
    </form>
  );
}
