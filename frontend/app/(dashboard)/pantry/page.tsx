import { PantryHeader } from "@/components/pantry-header"
import { PantryStats } from "@/components/pantry-stats"
import { PantryGrid } from "@/components/pantry-grid"
import type { PantryItem } from "@/lib/types"

export default async function PantryPage() {
  let items: PantryItem[] | undefined = undefined

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"
    const res = await fetch(`${apiBase}/pantry-item`, { cache: "no-store" })
    if (res.ok) {
      const data = await res.json()
      const arr = Array.isArray(data) ? data : data.items ?? data.data ?? undefined
      if (arr) {
        items = arr.map((it: any) => ({ ...it, expiryDate: it.expiryDate ? new Date(it.expiryDate) : undefined }))
      }
    } else {
      console.warn("Failed to fetch pantry items", res.status)
    }
  } catch (err) {
    console.warn("Error fetching pantry items:", err)
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <PantryHeader />
      <PantryStats />
      <PantryGrid items={items} />
    </div>
  )
}
