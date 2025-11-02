import { Card } from "@/components/ui/card"
import { tasks } from "@/lib/data"
import { CheckCircle2, Clock, ListTodo } from "lucide-react"

export function ActivitiesStats() {
  const todoTasks = tasks.filter((t) => t.status === "todo").length
  const doingTasks = tasks.filter((t) => t.status === "doing").length
  const doneTasks = tasks.filter((t) => t.status === "done").length

  const tasksByPerson = tasks.reduce(
    (acc, task) => {
      acc[task.assignee] = (acc[task.assignee] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  const topContributor = Object.entries(tasksByPerson).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center">
            <ListTodo className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">To-do</p>
            <p className="text-2xl font-bold text-gray-900">{todoTasks}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <Clock className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">In Progress</p>
            <p className="text-2xl font-bold text-gray-900">{doingTasks}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Completed</p>
            <p className="text-2xl font-bold text-gray-900">{doneTasks}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Top Contributor</p>
            <p className="text-lg font-bold text-gray-900 truncate">{topContributor[0]}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
