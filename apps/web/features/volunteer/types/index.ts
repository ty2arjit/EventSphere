export interface TaskResponse {
  id: string;
  eventId: string;
  committeeRoleId: string | null;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  assignments: string[];
  dependsOn: string[];
  checklistItems: ChecklistItem[];
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
}

export interface CreateTaskInput {
  eventId: string;
  title: string;
  description?: string;
  priority?: string;
  dueDate?: string;
}
