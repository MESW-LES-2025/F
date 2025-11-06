"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { apiGet, apiPost, apiPatch } from "@/lib/api-client"
import { authService } from "@/lib/auth-service"

export default function PantryAddItem() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState<number | undefined>(undefined)
  const [unit, setUnit] = useState("UNITS")
  const [expiry, setExpiry] = useState("")
  const [category, setCategory] = useState("OTHER")

  const [houses, setHouses] = useState<Array<{ id: string; name?: string }>>([])
  const [houseId, setHouseId] = useState("")
  const [pantryMap, setPantryMap] = useState<Record<string, string>>({})
  const [notAuthenticated, setNotAuthenticated] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    let mounted = true

    async function loadHousesAndPantries() {
      try {
        if (!authService.isAuthenticated()) {
          setNotAuthenticated(true)
        } else {
          setNotAuthenticated(false)
          const userHouses: any = await apiGet('/house/user', { requiresAuth: true })
          if (Array.isArray(userHouses) && mounted) {
            const parsed = userHouses.map((h: any) => ({ id: h.id, name: h.name }))
            setHouses(parsed)
            if (parsed.length === 1) setHouseId(parsed[0].id)
          }
        }
      } catch (err) {
        console.error('Failed fetching houses', err)
      }

      try {
        const allPantries: any = await apiGet('/pantry')
        if (Array.isArray(allPantries) && mounted) {
          const map: Record<string, string> = {}
          allPantries.forEach((p: any) => {
            if (p.houseId && p.id) map[p.houseId] = p.id
          })
          setPantryMap(map)
        }
      } catch (err) {
        console.error('Failed fetching pantries', err)
      }
    }

    loadHousesAndPantries()
    return () => {
      mounted = false
    }
  }, [])

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault()

    if (!name.trim()) {
      toast({ title: 'Please add a name for the item.', description: 'Name is required.' })
      return
    }

    if (!quantity || Number(quantity) <= 0) {
      toast({ title: 'Quantity required', description: 'Please provide a quantity greater than 0.' })
      return
    }

    // If user has no houses selected and there is exactly one, pick it.
    const resolvedHouseId = houseId || (houses.length === 1 ? houses[0].id : '')

    if (!resolvedHouseId) {
      toast({ title: 'House required', description: 'Please choose a house to add this item to.' })
      return
    }

    if (!authService.isAuthenticated()) {
      toast({ title: 'Login required', description: 'Please log in to create and add items to your pantry.' })
      return
    }

    setIsSaving(true)
    try {
      const body: any = {
        name: name.trim(),
        measurementUnit: String(unit).trim(),
        imageLink: 'https://via.placeholder.com/150',
        category: String(category).
          trim?.() ?? category,
      }

      // Create pantry item under the selected house (backend expects POST /pantry-item/:houseId)
      const created: any = await apiPost(`/pantry-item/${resolvedHouseId}`, body, { requiresAuth: true })

      // DEBUG: log created id and pantry mapping to help trace missing PantryToItem rows
      console.debug('[pantry-add] created item', created)
      console.debug('[pantry-add] pantryMap (houseId -> pantryId)', pantryMap)

      let resolvedPantryId = pantryMap[resolvedHouseId]
      console.debug('[pantry-add] resolvedHouseId', resolvedHouseId, 'resolvedPantryId', resolvedPantryId)

      // If we don't have a pantry mapping (possible in dev after migrations), re-fetch pantries once and retry
      if (!resolvedPantryId) {
        try {
          const refreshed: any = await apiGet('/pantry')
          if (Array.isArray(refreshed)) {
            const map: Record<string, string> = {}
            refreshed.forEach((p: any) => {
              if (p.houseId && p.id) map[p.houseId] = p.id
            })
            setPantryMap(map)
            resolvedPantryId = map[resolvedHouseId]
            console.debug('[pantry-add] refreshed pantryMap', map)
          }
        } catch (err) {
          console.error('Failed to refresh pantries', err)
        }
      }

      if (!resolvedPantryId) {
        console.warn('[pantry-add] Pantry not found for house', resolvedHouseId)
        toast({ title: 'Pantry not found', description: 'Could not find a pantry for the selected house.' })
      } else {
        try {
          const patchBodyItem: any = { itemId: created.id, quantity: Number(quantity) }
          if (expiry) patchBodyItem.expiryDate = expiry

          const patchResp: any = await apiPatch(
              `/pantry/${resolvedHouseId}/${resolvedPantryId}`,
              { items: [patchBodyItem] },
              { requiresAuth: true },
            )
          console.debug('[pantry-add] patch response', patchResp)
          toast({ title: 'Added to pantry', description: 'The item was added to the pantry with the given quantity.' })
        } catch (err: any) {
          console.error('Failed to add to pantry', err)
          toast({ title: 'Created catalog item', description: 'Item created but failed to add to pantry. Check permissions.' })
        }
      }

  setOpen(false)
  setName("")
  setUnit('UNITS')
  setExpiry("")
      setQuantity(undefined)
      setHouseId("")

      toast({ title: 'Item created', description: 'The pantry item was created successfully.' })
      router.refresh()
    } catch (err: any) {
      console.error(err)
      const message = err?.message ?? 'Failed to create item'
      toast({ title: 'Error', description: message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </DialogTrigger>

      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add pantry item</DialogTitle>
            <DialogDescription>
              Fill the item details. The item will be created and added to your pantry.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="item-name">Product name</Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Milk"
                disabled={isSaving}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  value={quantity ?? ""}
                  onChange={(e) => setQuantity(e.target.value ? Number(e.target.value) : undefined)}
                  type="number"
                  min={0}
                  step="any"
                  placeholder="e.g. 2"
                  disabled={isSaving}
                />
              </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select defaultValue={unit} onValueChange={(v) => setUnit(v)}>
                <SelectTrigger id="unit" className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="L">L</SelectItem>
                  <SelectItem value="KG">kg</SelectItem>
                  <SelectItem value="ML">ml</SelectItem>
                  <SelectItem value="G">g</SelectItem>
                  <SelectItem value="UNITS">unit</SelectItem>
                  <SelectItem value="LOAF">loaf</SelectItem>
                  <SelectItem value="JAR">jar</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="expiry">Expiry date</Label>
                <Input
                  id="expiry"
                  type="date"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select defaultValue={category} onValueChange={(v) => setCategory(v)}>
                  <SelectTrigger id="category" className="w-full h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="OTHER">Pantry / Other</SelectItem>
                    <SelectItem value="GRAINS">Grains</SelectItem>
                    <SelectItem value="DAIRY">Dairy</SelectItem>
                    <SelectItem value="VEGETABLES">Vegetables</SelectItem>
                    <SelectItem value="FRUITS">Fruits</SelectItem>
                    <SelectItem value="MEAT">Meat</SelectItem>
                    <SelectItem value="FROZEN">Frozen</SelectItem>
                    <SelectItem value="CONDIMENTS">Household / Condiments</SelectItem>
                    <SelectItem value="BEVERAGES">Beverages</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="mb-1 block">House</Label>
              {notAuthenticated ? (
                <div className="text-sm text-gray-600">Login to see your houses</div>
              ) : houses.length > 0 ? (
                <select value={houseId} onChange={(e) => setHouseId(e.target.value)} className="w-full p-2 border rounded" disabled={isSaving}>
                  <option value="">Choose a house</option>
                  {houses.map((h) => (
                    <option key={h.id} value={h.id}>{h.name ?? h.id}</option>
                  ))}
                </select>
              ) : (
                <div className="text-sm text-gray-600">No houses found. Create or join a house first.</div>
              )}
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost" type="button" disabled={isSaving}>Cancel</Button>
            </DialogClose>
            <Button type="submit" disabled={isSaving || notAuthenticated || !quantity}>{isSaving ? 'Saving…' : 'Create'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
