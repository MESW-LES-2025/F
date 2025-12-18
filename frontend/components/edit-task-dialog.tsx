"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// Removed unused Select import
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { updateTask, stopRecurringTask } from "@/lib/tasks-service";
import { apiGet } from "@/lib/api-client";
import type { Task, User } from "@/lib/types";
import { Repeat, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EditTaskDialogProps {
  task: Task;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskUpdated?: (task: Task) => void;
}

export function EditTaskDialog({
  task,
  open,
  onOpenChange,
  onTaskUpdated,
}: EditTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isStoppingRecurrence, setIsStoppingRecurrence] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    assignedUserIds: task.assignedUsers
      ? task.assignedUsers.map((u) => u.id)
      : ([] as string[]),
    size: (task as any).size || "",
    assignee: "",
    deadline: task.deadline
      ? new Date(task.deadline).toISOString().split("T")[0]
      : "",
    status: task.status,
  });

  const [formErrors, setFormErrors] = useState({
    title: false,
    assignee: false,
    deadline: false,
  });

  // Load users from task's house when dialog opens
  useEffect(() => {
    if (open) {
      loadHouseUsers();
      // Reset form data when opening
      setFormData({
        title: task.title,
        description: task.description || "",
        assignedUserIds: task.assignedUsers
          ? task.assignedUsers.map((u) => u.id)
          : [],
        size: (task as any).size || "",
        assignee: "",
        deadline: task.deadline
          ? new Date(task.deadline).toISOString().split("T")[0]
          : "",
        status: task.status,
      });
      setFormErrors({
        title: false,
        assignee: false,
        deadline: false,
      });
      setError(null);
    }
  }, [open, task]);

  const loadHouseUsers = async () => {
    if (!task.houseId) {
      setError("Task does not have an associated house.");
      setUsers([]);
      return;
    }

    try {
      // Fetch users from the task's house
      const response = await apiGet<User[]>(`/house/${task.houseId}/users`, {
        requiresAuth: true,
      });
      setUsers(response);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Failed to load users from this house.");
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleAssigneeChange = (value: string) => {
    // keep single-assignee compatibility
    setFormData((prev) => ({
      ...prev,
      assignee: value,
      assignedUserIds: [value],
    }));
    if (formErrors.assignee) {
      setFormErrors((prev) => ({ ...prev, assignee: false }));
    }
  };

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      status: value as "todo" | "doing" | "done",
    }));
  };

  const handleSizeChange = (value: string) => {
    setFormData((prev) => ({
      ...prev,
      size: value as "SMALL" | "MEDIUM" | "LARGE" | "XL",
    }));
  };

  const validateForm = () => {
    const errors = {
      title: !formData.title.trim(),
      assignee: false, // Assignee is optional on edit
      deadline: !formData.deadline,
    };

    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!validateForm()) {
      setError("Please fill in all required fields (Title and Deadline).");
      return;
    }

    setIsLoading(true);

    try {
      // Build update payload - only include changed fields
      const updatePayload: any = {
        title: formData.title.trim(),
        deadline: new Date(formData.deadline).toISOString(),
        status: formData.status,
      };

      if (formData.description.trim()) {
        updatePayload.description = formData.description.trim();
      }

      if (
        (formData as any).assignedUserIds &&
        (formData as any).assignedUserIds.length > 0
      ) {
        updatePayload.assignedUserIds = (formData as any).assignedUserIds;
        updatePayload.assigneeId = (formData as any).assignedUserIds[0];
      } else if (formData.assignee) {
        updatePayload.assigneeId = formData.assignee;
      }

      if ((formData as any).size) {
        updatePayload.size = (formData as any).size;
      }

      // Update the task via API
      const updatedTask = await updateTask(task.id, updatePayload);

      // Call the callback with the updated task
      onTaskUpdated?.(updatedTask);

      // Close dialog
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to update task. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopRecurrence = async () => {
    if (!task.isRecurring) return;

    setIsStoppingRecurrence(true);
    try {
      const result = await stopRecurringTask(task.id);
      
      toast({
        title: "Recurrence stopped",
        description: result.message,
      });

      // Update the task with the new data
      onTaskUpdated?.(result.task);
      onOpenChange(false);
    } catch (err) {
      toast({
        title: "Failed to stop recurrence",
        description: err instanceof Error ? err.message : "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsStoppingRecurrence(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>

          {task.isRecurring && (
            <div className="mt-4 rounded-lg border border-purple-200 bg-gradient-to-r from-purple-50 to-purple-50/30 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-purple-600 p-2">
                    <Repeat className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-900">
                        {task.recurrencePattern === "DAILY" && "Daily"}
                        {task.recurrencePattern === "WEEKLY" && "Weekly"}
                        {task.recurrencePattern === "MONTHLY" && "Monthly"}
                        {task.recurrenceInterval && task.recurrenceInterval > 1
                          ? ` (every ${task.recurrenceInterval})`
                          : ""}
                      </span>
                      <span className="text-xs text-gray-500">• Recurring task</span>
                    </div>
                    {task.nextRecurrenceDate && (
                      <p className="text-xs text-gray-600 mt-0.5">
                        Next occurrence: {new Date(task.nextRecurrenceDate).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleStopRecurrence}
                  disabled={isStoppingRecurrence}
                  className="bg-white border-purple-300 text-purple-700 hover:bg-purple-50 hover:text-purple-900 text-xs"
                >
                  {isStoppingRecurrence ? "Stopping..." : "Stop recurrence"}
                </Button>
              </div>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                name="title"
                placeholder="Enter task title"
                value={formData.title}
                onChange={handleChange}
                aria-invalid={formErrors.title}
                className={formErrors.title ? "border-destructive" : ""}
              />
              {formErrors.title && (
                <p className="text-sm text-destructive">Title is required</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Enter task description (optional)"
                value={formData.description}
                onChange={handleChange}
                className="min-h-[100px]"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(v) => handleStatusChange(v)}
              >
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To-do</SelectItem>
                  <SelectItem value="doing">Doing</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Change Assignee (optional)</Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    {((formData as any).assignedUserIds || []).length > 0 ? (
                      <span className="text-xs text-gray-700 truncate">
                        {users
                          .filter((u) =>
                            ((formData as any).assignedUserIds || []).includes(
                              u.id,
                            ),
                          )
                          .map((u) => u.name.split(" ")[0])
                          .join(", ")}
                      </span>
                    ) : (
                      "Select assignees"
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 max-h-72 overflow-y-auto">
                  <DropdownMenuLabel>
                    Select one or more users
                  </DropdownMenuLabel>
                  {users.map((user) => (
                    <DropdownMenuCheckboxItem
                      key={user.id}
                      checked={(formData as any).assignedUserIds.includes(
                        user.id,
                      )}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => {
                          const ids = new Set(
                            (prev as any).assignedUserIds as string[],
                          );
                          if (checked) ids.add(user.id);
                          else ids.delete(user.id);
                          return {
                            ...prev,
                            assignedUserIds: Array.from(ids) as string[],
                          };
                        });
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{user.name}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Effort Size</Label>
              <Select
                value={(formData as any).size || ""}
                onValueChange={(v) => handleSizeChange(v)}
              >
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue placeholder="Select size (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMALL">Small</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="LARGE">Large</SelectItem>
                  <SelectItem value="XL">XL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">
                Deadline <span className="text-destructive">*</span>
              </Label>
              <Input
                id="deadline"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
                aria-invalid={formErrors.deadline}
                className={formErrors.deadline ? "border-destructive" : ""}
                min={new Date().toISOString().split("T")[0]}
              />
              {formErrors.deadline && (
                <p className="text-sm text-destructive">Deadline is required</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-green-600 hover:bg-green-700 cursor-pointer"
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
