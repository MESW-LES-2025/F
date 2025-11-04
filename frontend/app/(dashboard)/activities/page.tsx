"use client"

import { useState } from "react"
import { ActivitiesHeader } from "@/components/activities-header"
import { ActivitiesStats } from "@/components/activities-stats"
import { ActivitiesKanban } from "@/components/activities-kanban"
import { tasks as defaultTasks } from "@/lib/data"
import type { Task } from "@/lib/types"

export default function ActivitiesPage() {
  const [tasks, setTasks] = useState<Task[]>(defaultTasks)

  const handleTaskCreated = (newTask: Task) => {
    setTasks((prevTasks) => [...prevTasks, newTask])
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <ActivitiesHeader onTaskCreated={handleTaskCreated} />
      <ActivitiesStats />
      <ActivitiesKanban tasks={tasks} />
    </div>
  )
}
