"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus } from "lucide-react";
import { createTask } from "@/lib/tasks-service";
import type { Task, User } from "@/lib/types";
import { useEffect } from "react";
import { apiGet } from "@/lib/api-client";
import { useHouse } from "@/lib/house-context";

interface CreateTaskDialogProps {
  onTaskCreated?: (task: Task) => void;
}

export function CreateTaskDialog({ onTaskCreated }: CreateTaskDialogProps) {
  const { selectedHouse } = useHouse();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedUserIds: [] as string[],
    size: "",
    deadline: "",
  });

  const [formErrors, setFormErrors] = useState({
    title: false,
    assignee: false,
    deadline: false,
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleAssigneeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, assignedUserIds: [value] }));
    if (formErrors.assignee) {
      setFormErrors((prev) => ({ ...prev, assignee: false }));
    }
  };

  const validateForm = () => {
    const errors = {
      title: !formData.title.trim(),
      assignee:
        !(formData as any).assignedUserIds ||
        (formData as any).assignedUserIds.length === 0,
      deadline: !formData.deadline,
    };

    setFormErrors(errors);

    return !Object.values(errors).some((error) => error);
  };

  // Load users from selected house when dialog opens
  useEffect(() => {
    if (open && selectedHouse) {
      loadHouseUsers();
    }
  }, [open, selectedHouse]);

  const loadHouseUsers = async () => {
    if (!selectedHouse) {
      setError("Please select a house first.");
      setUsers([]);
      return;
    }

    try {
      // Fetch users from the selected house
      const response = await apiGet<User[]>(
        `/house/${selectedHouse.id}/users`,
        { requiresAuth: true },
      );
      setUsers(response);
    } catch (err) {
      console.error("Failed to load users:", err);
      setError("Failed to load users from this house.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validate required fields
    if (!validateForm()) {
      setError(
        "Please fill in all required fields (Title, Assignee, and Deadline).",
      );
      return;
    }

    setIsLoading(true);

    try {
      if (!selectedHouse) {
        setError("Please select a house first.");
        return;
      }

      // Create the task via API
      const newTask = await createTask({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        assignedUserIds: (formData as any).assignedUserIds,
        size: (formData as any).size || undefined,
        deadline: new Date(formData.deadline).toISOString(),
        houseId: selectedHouse.id,
      });

      // Call the callback with the new task
      onTaskCreated?.(newTask);

      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        assignedUserIds: [],
        size: "",
        deadline: "",
      });
      setFormErrors({
        title: false,
        assignee: false,
        deadline: false,
      });
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to create task. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when dialog closes
      setFormData({
        title: "",
        description: "",
        assignedUserIds: [],
        size: "",
        deadline: "",
      });
      setFormErrors({
        title: false,
        assignee: false,
        deadline: false,
      });
      setError(null);
    }
    setOpen(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-green-600 hover:bg-green-700 cursor-pointer"
        >
          <Plus className="w-4 h-4 mr-1" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to the board. All fields marked with * are
              required.
            </DialogDescription>
          </DialogHeader>

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
              <Label htmlFor="assignees">
                Assignees <span className="text-destructive">*</span>
              </Label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-between font-normal"
                  >
                    {formData.assignedUserIds &&
                    formData.assignedUserIds.length > 0 ? (
                      <span className="text-xs text-gray-700 truncate">
                        {users
                          .filter((u) =>
                            (formData.assignedUserIds || []).includes(u.id),
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
                      checked={(formData.assignedUserIds || []).includes(
                        user.id,
                      )}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => {
                          const ids = new Set(prev.assignedUserIds);
                          if (checked) ids.add(user.id);
                          else ids.delete(user.id);
                          return { ...prev, assignedUserIds: Array.from(ids) };
                        });
                        if (formErrors.assignee)
                          setFormErrors((prev) => ({
                            ...prev,
                            assignee: false,
                          }));
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{user.name}</span>
                      </div>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              {formErrors.assignee && (
                <p className="text-sm text-destructive">
                  At least one assignee is required
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="size">Estimate</Label>
              <Select
                value={(formData as any).size || ""}
                onValueChange={(v) =>
                  setFormData((prev) => ({ ...prev, size: v }))
                }
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
              onClick={() => setOpen(false)}
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
              {isLoading ? "Creating..." : "Create Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
