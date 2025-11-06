import PantryContainer from "@/components/pantry-container"
import type { PantryItem } from "@/lib/types"

export default async function PantryPage() {
  let items: PantryItem[] | undefined = undefined

  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api/v1"

    // Try getting the user's houses (may 401 if not authenticated in SSR)
    let houseId: string | undefined
    try {
      const housesRes = await fetch(`${apiBase}/house/user`, { cache: "no-store" })
      if (housesRes.ok) {
        const houses = await housesRes.json()
        houseId = Array.isArray(houses) && houses.length ? houses[0].id : undefined
      } else {
        // Don't throw here; we'll attempt fallbacks below.
        console.warn('pantry page: GET /house/user returned', housesRes.status)
      }
    } catch (innerErr) {
      // network or other low-level error
      console.warn('pantry page: failed to fetch houses', innerErr)
    }

    // Helper to map pantryData.items -> frontend items
    const mapPantryItems = (arr: any[] = []) =>
      arr.map((pi: any) => ({
        id: pi.item?.id ?? pi.itemId ?? 'unknown',
        name: pi.item?.name ?? pi.name ?? 'Unknown',
        quantity: pi.quantity ?? 0,
        unit: pi.item?.measurementUnit ?? 'unit',
        category: pi.item?.category ?? 'OTHER',
        addedBy: pi.user?.name ?? 'Unknown',
        addedByAvatar: pi.user?.avatarUrl ?? '',
        expiryDate: pi.expiryDate ? new Date(pi.expiryDate) : undefined,
        lowStock: Number(pi.quantity ?? 0) <= 1,
      }))

    let pantryFound = false

    // If we got a houseId, prefer that pantry first
    if (houseId) {
      const panRes = await fetch(`${apiBase}/pantry`, { cache: "no-store" })
      if (panRes.ok) {
        const pans = await panRes.json()
        const pantry = Array.isArray(pans) ? pans.find((p: any) => p.houseId === houseId) : undefined
        if (pantry) {
          const pantryRes = await fetch(`${apiBase}/pantry/${houseId}/${pantry.id}`, { cache: "no-store" })
          if (pantryRes.ok) {
            const pantryData = await pantryRes.json()
                items = mapPantryItems(pantryData?.items ?? [])
            pantryFound = true
          }
        }
      }
    }

    // Fallback: try any pantry (first available)
    if (!pantryFound) {
      const panRes = await fetch(`${apiBase}/pantry`, { cache: "no-store" })
      if (panRes.ok) {
        const pans = await panRes.json()
        const pantry = Array.isArray(pans) && pans.length ? pans[0] : undefined
        if (pantry) {
          const pantryRes = await fetch(`${apiBase}/pantry/${pantry.houseId}/${pantry.id}`, { cache: "no-store" })
          if (pantryRes.ok) {
            const pantryData = await pantryRes.json()
                items = mapPantryItems(pantryData?.items ?? [])
            pantryFound = true
          }
        }
      }
    }

    // Last resort: fetch pantry-item catalog (no quantities, but show names)
    if (!pantryFound) {
      const res = await fetch(`${apiBase}/pantry-item`, { cache: "no-store" })
      if (res.ok) {
        const data = await res.json()
        const arr = Array.isArray(data) ? data : data.items ?? data.data ?? []
        items = arr.map((it: any) => ({
          id: it.id,
          name: it.name,
          quantity: 0,
          unit: it.measurementUnit ?? 'unit',
          category: it.category ?? 'OTHER',
          addedBy: it.createdByUser ?? 'Unknown',
          addedByAvatar: it.createdByUserAvatar ?? '',
          expiryDate: it.expiryDate ? new Date(it.expiryDate) : undefined,
          lowStock: false,
        }))
      } else {
        console.warn('pantry page: GET /pantry-item returned', res.status)
      }
    }
  } catch (err) {
    console.warn("Error fetching pantry items:", err)
  }

  return (
    <div>
      <PantryContainer items={items} />
    </div>
  )
}
