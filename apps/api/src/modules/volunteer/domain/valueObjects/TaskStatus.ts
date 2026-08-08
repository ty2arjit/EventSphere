export type TaskStatus = "Todo" | "InProgress" | "Blocked" | "Completed" | "Cancelled";

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  Todo: ["InProgress", "Cancelled"],
  InProgress: ["Blocked", "Completed", "Cancelled"],
  Blocked: ["InProgress", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

export function canTransitionTask(from: TaskStatus, to: TaskStatus): boolean {
  return VALID_TRANSITIONS[from].includes(to);
}
