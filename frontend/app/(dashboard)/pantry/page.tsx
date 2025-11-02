import { PantryHeader } from "@/components/pantry-header"
import { PantryStats } from "@/components/pantry-stats"
import { PantryGrid } from "@/components/pantry-grid"

export default function PantryPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PantryHeader />
      <PantryStats />
      <PantryGrid />
    </div>
  )
}
