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
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Repeat } from "lucide-react";
import { createTask } from "@/lib/tasks-service";
import type { Task, User, RecurrencePattern } from "@/lib/types";
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
    isRecurring: false,
    recurrencePattern: "" as RecurrencePattern | "",
    recurrenceInterval: 1,
  });

  const [formErrors, setFormErrors] = useState({
    title: false,
    assignee: false,
    deadline: false,
    recurrencePattern: false,
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
      recurrencePattern: formData.isRecurring && !formData.recurrencePattern,
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
      const missingFields = [];
      if (formErrors.title) missingFields.push("Title");
      if (formErrors.assignee) missingFields.push("Assignee");
      if (formErrors.deadline) missingFields.push("Deadline");
      if (formErrors.recurrencePattern) missingFields.push("Recurrence Pattern");
      
      setError(
        `Please fill in all required fields: ${missingFields.join(", ")}`
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
        isRecurring: formData.isRecurring,
        recurrencePattern: formData.isRecurring && formData.recurrencePattern 
          ? (formData.recurrencePattern as RecurrencePattern)
          : undefined,
        recurrenceInterval: formData.isRecurring && formData.recurrenceInterval
          ? formData.recurrenceInterval
          : undefined,
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
        isRecurring: false,
        recurrencePattern: "",
        recurrenceInterval: 1,
      });
      setFormErrors({
        title: false,
        assignee: false,
        deadline: false,
        recurrencePattern: false,
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
        isRecurring: false,
        recurrencePattern: "",
        recurrenceInterval: 1,
      });
      setFormErrors({
        title: false,
        assignee: false,
        deadline: false,
        recurrencePattern: false,
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
      <DialogContent className="sm:max-w-[525px] max-h-[90vh] overflow-y-auto">
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

            {/* Recurrence Section */}
            <div className="space-y-3 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({
                      ...prev,
                      isRecurring: checked as boolean,
                      recurrencePattern: checked ? prev.recurrencePattern : "",
                    }))
                  }
                />
                <Label
                  htmlFor="isRecurring"
                  className="text-sm font-medium flex items-center gap-2 cursor-pointer"
                >
                  <Repeat className="w-4 h-4" />
                  Make this a recurring task
                </Label>
              </div>

              {formData.isRecurring && (
                <div className="ml-6 space-y-3 animate-in fade-in-50 duration-200">
                  <div className="space-y-2">
                    <Label htmlFor="recurrencePattern">
                      Recurrence Pattern <span className="text-destructive">*</span>
                    </Label>
                    <Select
                      value={formData.recurrencePattern}
                      onValueChange={(v) => {
                        setFormData((prev) => ({
                          ...prev,
                          recurrencePattern: v as RecurrencePattern,
                        }));
                        if (formErrors.recurrencePattern) {
                          setFormErrors((prev) => ({ ...prev, recurrencePattern: false }));
                        }
                      }}
                    >
                      <SelectTrigger 
                        className={`w-full ${formErrors.recurrencePattern ? "border-destructive" : ""}`}
                      >
                        <SelectValue placeholder="Select pattern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DAILY">Daily</SelectItem>
                        <SelectItem value="WEEKLY">Weekly</SelectItem>
                        <SelectItem value="MONTHLY">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    {formErrors.recurrencePattern && (
                      <p className="text-sm text-destructive">
                        Recurrence pattern is required when task is recurring
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="recurrenceInterval">
                      Repeat every
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="recurrenceInterval"
                        name="recurrenceInterval"
                        type="number"
                        min="1"
                        max="365"
                        value={formData.recurrenceInterval}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            recurrenceInterval: parseInt(e.target.value) || 1,
                          }))
                        }
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        {formData.recurrencePattern === "DAILY" && "day(s)"}
                        {formData.recurrencePattern === "WEEKLY" && "week(s)"}
                        {formData.recurrencePattern === "MONTHLY" &&
                          "month(s)"}
                        {!formData.recurrencePattern && "unit(s)"}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Task will automatically reappear based on this schedule
                    </p>
                  </div>
                </div>
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
