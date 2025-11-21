"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { updateTask } from "@/lib/tasks-service"
import { apiGet } from "@/lib/api-client"
import type { Task, User } from "@/lib/types"

interface EditTaskDialogProps {
  task: Task
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskUpdated?: (task: Task) => void
}

export function EditTaskDialog({ task, open, onOpenChange, onTaskUpdated }: EditTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [formData, setFormData] = useState({
    title: task.title,
    description: task.description || "",
    assignee: "",
    deadline: task.deadline ? new Date(task.deadline).toISOString().split("T")[0] : "",
    status: task.status,
  })

  const [formErrors, setFormErrors] = useState({
    title: false,
    assignee: false,
    deadline: false,
  })

  // Load users from task's house when dialog opens
  useEffect(() => {
    if (open) {
      loadHouseUsers()
      // Reset form data when opening
      setFormData({
        title: task.title,
        description: task.description || "",
        assignee: "",
        deadline: task.deadline ? new Date(task.deadline).toISOString().split("T")[0] : "",
        status: task.status,
      })
      setFormErrors({
        title: false,
        assignee: false,
        deadline: false,
      })
      setError(null)
    }
  }, [open, task])

  const loadHouseUsers = async () => {
    if (!task.houseId) {
      setError('Task does not have an associated house.')
      setUsers([])
      return
    }

    try {
      // Fetch users from the task's house
      const response = await apiGet<User[]>(`/auth/users/house/${task.houseId}`, { requiresAuth: true })
      setUsers(response)
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('Failed to load users from this house.')
    }
  }

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    // Clear error for this field when user starts typing
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({ ...prev, [name]: false }))
    }
  }

  const handleAssigneeChange = (value: string) => {
    setFormData((prev) => ({ ...prev, assignee: value }))
    if (formErrors.assignee) {
      setFormErrors((prev) => ({ ...prev, assignee: false }))
    }
  }

  const handleStatusChange = (value: string) => {
    setFormData((prev) => ({ ...prev, status: value as 'todo' | 'doing' | 'done' }))
  }

  const validateForm = () => {
    const errors = {
      title: !formData.title.trim(),
      assignee: false, // Assignee is optional on edit
      deadline: !formData.deadline,
    }

    setFormErrors(errors)

    return !Object.values(errors).some((error) => error)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!validateForm()) {
      setError("Please fill in all required fields (Title and Deadline).")
      return
    }

    setIsLoading(true)

    try {
      // Build update payload - only include changed fields
      const updatePayload: {
        title: string
        description?: string
        assigneeId?: string
        deadline: string
        status: 'todo' | 'doing' | 'done'
      } = {
        title: formData.title.trim(),
        deadline: new Date(formData.deadline).toISOString(),
        status: formData.status,
      }

      if (formData.description.trim()) {
        updatePayload.description = formData.description.trim()
      }

      if (formData.assignee) {
        updatePayload.assigneeId = formData.assignee
      }

      // Update the task via API
      const updatedTask = await updateTask(task.id, updatePayload)

      // Call the callback with the updated task
      onTaskUpdated?.(updatedTask)

      // Close dialog
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update task. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
            <DialogDescription>
              Update the task details. Fields marked with * are required.
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
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={handleStatusChange}
              >
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
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
              <Select
                value={formData.assignee}
                onValueChange={handleAssigneeChange}
              >
                <SelectTrigger id="assignee">
                  <SelectValue placeholder="Keep current assignee" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
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
  )
}
