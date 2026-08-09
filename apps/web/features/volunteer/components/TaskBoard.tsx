"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listTasks, transitionTask } from "../api/volunteerClient";
import type { TaskResponse } from "../types";
import { StaggerList, StaggerItem } from "@/components/motion/StaggerList";
import { Spinner } from "@/components/ui/Spinner";

const COLUMNS = ["Todo", "InProgress", "Blocked", "Completed", "Cancelled"] as const;

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "border-l-destructive",
  High: "border-l-accent",
  Medium: "border-l-primary/60",
  Low: "border-l-muted-foreground/40",
};

const NEXT_STATUS: Record<string, string[]> = {
  Todo: ["InProgress"],
  InProgress: ["Completed", "Blocked"],
  Blocked: ["InProgress"],
};

interface TaskBoardProps {
  eventId: string;
  canManage?: boolean;
}

export function TaskBoard({ eventId, canManage = false }: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    listTasks(eventId, { signal: controller.signal }).then((result) => {
      if (result.ok) setTasks(result.data.data);
      setLoading(false);
    });
    return () => controller.abort();
  }, [eventId]);

  const handleTransition = async (taskId: string, targetStatus: string) => {
    const result = await transitionTask(taskId, targetStatus);
    if (result.ok) {
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, status: targetStatus } : t)),
      );
      toast.success(`Task moved to ${targetStatus}`);
    } else {
      toast.error("Failed to transition task");
    }
  };

  if (loading) return <Spinner label="Loading tasks…" />;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-5">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col);
        return (
          <div key={col} className="space-y-2.5">
            <h4 className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {col}
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{colTasks.length}</span>
            </h4>
            <StaggerList className="space-y-2">
              {colTasks.map((task) => (
                <StaggerItem key={task.id}>
                  <div
                    className={`space-y-2 rounded-lg border border-l-4 border-border bg-background/60 p-3 shadow-soft ${PRIORITY_COLORS[task.priority] ?? ""}`}
                  >
                    <p className="text-sm font-medium">{task.title}</p>
                    {task.description && (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{task.description}</p>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{task.priority}</span>
                      {task.dueDate && (
                        <span>&middot; Due {new Date(task.dueDate).toLocaleDateString()}</span>
                      )}
                    </div>
                    {task.checklistItems.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {task.checklistItems.filter((c) => c.completed).length}/{task.checklistItems.length} done
                      </div>
                    )}
                    {canManage && NEXT_STATUS[task.status] && (
                      <div className="flex flex-wrap gap-1">
                        {NEXT_STATUS[task.status].map((target) => (
                          <button
                            key={target}
                            onClick={() => handleTransition(task.id, target)}
                            className="rounded-full border border-border px-2 py-0.5 text-xs hover:bg-muted"
                          >
                            &rarr; {target}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </div>
        );
      })}
    </div>
  );
}
