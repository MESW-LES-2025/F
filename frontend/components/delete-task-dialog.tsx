"use client"

import { useState } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { deleteTask } from "@/lib/tasks-service"
import type { Task } from "@/lib/types"

interface DeleteTaskDialogProps {
  task: Task | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onTaskDeleted?: (taskId: string) => void
}

export function DeleteTaskDialog({ task, open, onOpenChange, onTaskDeleted }: DeleteTaskDialogProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!task) return

    setError(null)
    setIsLoading(true)

    try {
      await deleteTask(task.id)
      
      // Call the callback with the deleted task ID
      onTaskDeleted?.(task.id)

      // Close dialog
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete task. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (!task) return null

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Task</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete "{task.title}"? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} className="cursor-pointer">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isLoading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2 cursor-pointer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-red-100" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3m5 0H6" />
            </svg>
            <span className="text-red-100 font-semibold">
              {isLoading ? "Deleting..." : "Delete"}
            </span>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
