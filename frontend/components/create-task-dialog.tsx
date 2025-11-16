"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus } from "lucide-react"
import { createTask } from "@/lib/tasks-service"
import type { Task, User } from "@/lib/types"
import { useEffect } from "react"
import { apiGet } from "@/lib/api-client"

interface CreateTaskDialogProps {
  onTaskCreated?: (task: Task) => void
}

export function CreateTaskDialog({ onTaskCreated }: CreateTaskDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [userHouseId, setUserHouseId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignee: "",
    deadline: "",
  })

  const [formErrors, setFormErrors] = useState({
    title: false,
    assignee: false,
    deadline: false,
  })

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

  const validateForm = () => {
    const errors = {
      title: !formData.title.trim(),
      assignee: !formData.assignee,
      deadline: !formData.deadline,
    }

    setFormErrors(errors)

    return !Object.values(errors).some((error) => error)
  }

  // Load user's house and users when dialog opens
  useEffect(() => {
    if (open) {
      loadUserHouseAndUsers()
    }
  }, [open])

  const loadUserHouseAndUsers = async () => {
    try {
      // First, get the user's houses
      const houses = await apiGet<Array<{ id: string; name: string }>>('/house/user', { requiresAuth: true })
      
      if (houses && houses.length > 0) {
        // Use the first house (assuming user is in at least one house)
        const houseId = houses[0].id
        setUserHouseId(houseId)
        
        // Fetch users from the same house
        const response = await apiGet<User[]>(`/auth/users?houseId=${houseId}`, { requiresAuth: true })
        setUsers(response)
      } else {
        setError('You must belong to a house to create tasks.')
        setUsers([])
      }
    } catch (err) {
      console.error('Failed to load users:', err)
      setError('Failed to load users from your house.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!validateForm()) {
      setError("Please fill in all required fields (Title, Assignee, and Deadline).")
      return
    }

    setIsLoading(true)

    try {
      if (!userHouseId) {
        setError('You must belong to a house to create tasks.');
        return;
      }

      // Create the task via API
      const newTask = await createTask({
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        assigneeId: formData.assignee,
        deadline: new Date(formData.deadline).toISOString(),
        houseId: userHouseId,
      })

      // Call the callback with the new task
      onTaskCreated?.(newTask)

      // Reset form and close dialog
      setFormData({
        title: "",
        description: "",
        assignee: "",
        deadline: "",
      })
      setFormErrors({
        title: false,
        assignee: false,
        deadline: false,
      })
      setOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when dialog closes
      setFormData({
        title: "",
        description: "",
        assignee: "",
        deadline: "",
      })
      setFormErrors({
        title: false,
        assignee: false,
        deadline: false,
      })
      setError(null)
    }
    setOpen(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700 cursor-pointer">
          <Plus className="w-4 h-4 mr-1" />
          New Task
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Task</DialogTitle>
            <DialogDescription>
              Add a new task to the board. All fields marked with * are required.
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
              <Label htmlFor="assignee">
                Assignee <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.assignee}
                onValueChange={handleAssigneeChange}
              >
                <SelectTrigger
                  id="assignee"
                  aria-invalid={formErrors.assignee}
                  className={formErrors.assignee ? "border-destructive" : ""}
                >
                  <SelectValue placeholder="Select a person" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.assignee && (
                <p className="text-sm text-destructive">Assignee is required</p>
              )}
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
  )
}
