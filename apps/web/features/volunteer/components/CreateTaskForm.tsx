"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createTask } from "../api/volunteerClient";

interface CreateTaskFormProps {
  eventId: string;
  onCreated?: () => void;
}

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
    <form onSubmit={handleSubmit} className="space-y-3 border rounded-lg p-4">
      <h4 className="font-semibold">New Task</h4>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
        className="w-full px-3 py-2 border rounded-md"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full px-3 py-2 border rounded-md"
      />
      <select
        value={priority}
        onChange={(e) => setPriority(e.target.value)}
        className="w-full px-3 py-2 border rounded-md"
      >
        <option value="Low">Low</option>
        <option value="Medium">Medium</option>
        <option value="High">High</option>
        <option value="Critical">Critical</option>
      </select>
      <button
        type="submit"
        disabled={submitting || !title.trim()}
        className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:opacity-90 disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create Task"}
      </button>
    </form>
  );
}
