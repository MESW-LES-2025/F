"use client"

import { useState, useEffect } from "react"
import { ActivitiesHeader } from "@/components/activities-header"
import { ActivitiesStats } from "@/components/activities-stats"
import { ActivitiesKanban } from "@/components/activities-kanban"
import { EditTaskDialog } from "@/components/edit-task-dialog"
import { DeleteTaskDialog } from "@/components/delete-task-dialog"
import { getTasks } from "@/lib/tasks-service"
import type { Task } from "@/lib/types"
import { useHouse } from "@/lib/house-context"

export default function ActivitiesPage() {
  const { selectedHouse } = useHouse()
  const [tasks, setTasks] = useState<Task[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [deletingTask, setDeletingTask] = useState<Task | null>(null)

  // Load tasks when selectedHouse changes
  useEffect(() => {
    loadTasks()
  }, [selectedHouse])

  const loadTasks = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      // Only fetch tasks if a house is selected
      if (!selectedHouse) {
        setTasks([])
        setIsLoading(false)
        return
      }
      
      const fetchedTasks = await getTasks({ houseId: selectedHouse.id })
      setTasks(fetchedTasks)
    } catch (err) {
      console.error('Failed to load tasks:', err)
      setError('Failed to load tasks. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prevTasks) => [...prevTasks, newTask])
  }

  const handleTaskUpdated = (updatedTask: Task) => {
    setTasks((prevTasks) =>
      prevTasks.map((task) => (task.id === updatedTask.id ? updatedTask : task))
    )
  }

  const handleTaskDeleted = (taskId: string) => {
    setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
  }

  const handleEditTask = (task: Task) => {
    setEditingTask(task)
  }

  const handleDeleteTask = (task: Task) => {
    setDeletingTask(task)
  }

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <ActivitiesHeader onTaskCreated={handleTaskCreated} />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading tasks...</p>
        </div>
      </div>
    )
  }

  if (!selectedHouse) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <ActivitiesHeader onTaskCreated={handleTaskCreated} />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No house selected</p>
            <p className="text-sm text-gray-400">Please select a house to view tasks</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadTasks}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <ActivitiesHeader onTaskCreated={handleTaskCreated} />
      <ActivitiesStats />
      <ActivitiesKanban 
        tasks={tasks} 
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
      />

      {/* Edit Task Dialog */}
      {editingTask && (
        <EditTaskDialog
          task={editingTask}
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          onTaskUpdated={handleTaskUpdated}
        />
      )}

      {/* Delete Task Dialog */}
      <DeleteTaskDialog
        task={deletingTask}
        open={!!deletingTask}
        onOpenChange={(open) => !open && setDeletingTask(null)}
        onTaskDeleted={handleTaskDeleted}
      />
    </div>
  )
}
