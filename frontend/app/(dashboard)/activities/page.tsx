import { ActivitiesHeader } from "@/components/activities-header"
import { ActivitiesStats } from "@/components/activities-stats"
import { ActivitiesKanban } from "@/components/activities-kanban"

export default function ActivitiesPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <ActivitiesHeader />
      <ActivitiesStats />
      <ActivitiesKanban />
    </div>
  )
}
