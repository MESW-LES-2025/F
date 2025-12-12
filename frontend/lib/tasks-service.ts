import { apiGet, apiPost, apiPatch, apiDelete } from "./api-client";
import type { Task } from "./types";

export interface CreateTaskPayload {
  title: string;
  description?: string;
  assigneeId?: string;
  assignedUserIds?: string[];
  deadline: string;
  houseId: string;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  assigneeId?: string;
  assignedUserIds?: string[];
  size?: "SMALL" | "MEDIUM" | "LARGE" | "XL";
  deadline?: string;
  status?: "todo" | "doing" | "done";
}

export interface TaskResponse {
  id: string;
  title: string;
  description?: string;
  status: string;
  assigneeId: string;
  assignee: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
  createdById: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    username: string;
  };
  houseId: string;
  house: {
    id: string;
    name: string;
  };
  deadline: string;
  createdAt: string;
  updatedAt: string;
  archived: boolean;
  archivedAt?: string | null;
  assignedUsers?: { id: string; name: string; imageUrl?: string | null }[];
  size?: "SMALL" | "MEDIUM" | "LARGE" | "XL";
}

/**
 * Transform backend task response to frontend Task type
 */
function transformTask(backendTask: TaskResponse): Task {
  return {
    id: backendTask.id,
    title: backendTask.title,
    description: backendTask.description,
    assignee:
      (backendTask.assignedUsers && backendTask.assignedUsers[0]?.name) ||
      backendTask.assignee?.name ||
      backendTask.assignee?.username,
    assigneeAvatar:
      (backendTask.assignedUsers && backendTask.assignedUsers[0]?.imageUrl) ||
      "",
    assignedUsers:
      backendTask.assignedUsers?.map((u) => ({
        id: u.id,
        name: u.name,
        avatar: u.imageUrl || undefined,
      })) || [],
    status: backendTask.status as "todo" | "doing" | "done",
    deadline: new Date(backendTask.deadline),
    createdAt: new Date(backendTask.createdAt),
    houseId: backendTask.houseId,
    houseName: backendTask.house.name,
    archived: backendTask.archived,
    archivedAt: backendTask.archivedAt
      ? new Date(backendTask.archivedAt)
      : null,
    size: backendTask.size || "MEDIUM",
  };
}

/**
 * Get all tasks
 */
export async function getTasks(filters?: {
  assigneeId?: string;
  status?: string;
  houseId?: string;
  archived?: string;
}): Promise<Task[]> {
  console.log("[tasks-service] getTasks called with filters:", filters);
  const tasks = await apiGet<TaskResponse[]>("/tasks", {
    requiresAuth: true,
    params: filters as Record<string, string>,
  });
  console.log("[tasks-service] Received tasks:", tasks.length);

  return tasks.map(transformTask);
}

/**
 * Get a single task by ID
 */
export async function getTask(taskId: string): Promise<Task> {
  const task = await apiGet<TaskResponse>(`/tasks/${taskId}`, {
    requiresAuth: true,
  });

  return transformTask(task);
}

/**
 * Create a new task
 */
export async function createTask(taskData: CreateTaskPayload): Promise<Task> {
  const task = await apiPost<TaskResponse>("/tasks", taskData, {
    requiresAuth: true,
  });

  return transformTask(task);
}

/**
 * Update an existing task
 */
export async function updateTask(
  taskId: string,
  taskData: UpdateTaskPayload,
): Promise<Task> {
  const task = await apiPatch<TaskResponse>(`/tasks/${taskId}`, taskData, {
    requiresAuth: true,
  });

  return transformTask(task);
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  await apiDelete(`/tasks/${taskId}`, {
    requiresAuth: true,
  });
}

/**
 * Get tasks by assignee
 */
export async function getTasksByAssignee(assigneeId: string): Promise<Task[]> {
  return getTasks({ assigneeId });
}

/**
 * Get tasks by status
 */
export async function getTasksByStatus(
  status: "todo" | "doing" | "done",
): Promise<Task[]> {
  return getTasks({ status });
}

/**
 * Archive a task (only if done)
 */
export async function archiveTask(taskId: string): Promise<Task> {
  const task = await apiPatch<TaskResponse>(
    `/tasks/${taskId}/archive`,
    undefined,
    {
      requiresAuth: true,
    },
  );
  return transformTask(task);
}

/**
 * Unarchive a task
 */
export async function unarchiveTask(taskId: string): Promise<Task> {
  const task = await apiPatch<TaskResponse>(
    `/tasks/${taskId}/unarchive`,
    undefined,
    {
      requiresAuth: true,
    },
  );
  return transformTask(task);
}
