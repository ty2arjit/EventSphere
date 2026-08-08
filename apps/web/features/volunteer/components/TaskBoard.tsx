"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { listTasks, transitionTask } from "../api/volunteerClient";
import type { TaskResponse } from "../types";
import { StaggerList } from "@/components/motion/StaggerList";

const COLUMNS = ["Todo", "InProgress", "Blocked", "Completed", "Cancelled"] as const;

const PRIORITY_COLORS: Record<string, string> = {
  Critical: "border-l-red-500",
  High: "border-l-orange-500",
  Medium: "border-l-yellow-500",
  Low: "border-l-blue-500",
};

const NEXT_STATUS: Record<string, string[]> = {
  Todo: ["InProgress"],
  InProgress: ["Completed", "Blocked"],
  Blocked: ["InProgress"],
};

interface TaskBoardProps {
  eventId: string;
}

export function TaskBoard({ eventId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<TaskResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    listTasks(eventId, { signal: controller.signal }).then((result) => {
      if (result.ok) setTasks(result.data);
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

  if (loading) return <p className="text-muted-foreground text-sm">Loading tasks...</p>;

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Task Board</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col);
          return (
            <div key={col} className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                {col}
                <span className="bg-muted rounded-full px-2 py-0.5 text-xs">{colTasks.length}</span>
              </h4>
              <StaggerList>
                {colTasks.map((task) => (
                  <div
                    key={task.id}
                    className={`border-l-4 ${PRIORITY_COLORS[task.priority] ?? ""} border rounded-md p-3 space-y-2`}
                  >
                    <p className="font-medium text-sm">{task.title}</p>
                    {task.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>
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
                    {NEXT_STATUS[task.status] && (
                      <div className="flex gap-1 flex-wrap">
                        {NEXT_STATUS[task.status].map((target) => (
                          <button
                            key={target}
                            onClick={() => handleTransition(task.id, target)}
                            className="px-2 py-0.5 text-xs border rounded hover:bg-muted"
                          >
                            &rarr; {target}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </StaggerList>
            </div>
          );
        })}
      </div>
    </div>
  );
}
