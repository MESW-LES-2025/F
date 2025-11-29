"use client"

import { useHouse } from "@/lib/house-context"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Home } from "lucide-react"

export function HouseSelector() {
  const { selectedHouse, houses, setSelectedHouse, isLoading } = useHouse()

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Home className="w-4 h-4" />
        <span className="text-sm">Loading...</span>
      </div>
    )
  }

  if (!houses || houses.length === 0) {
    return (
      <div className="flex items-center gap-2 text-gray-400">
        <Home className="w-4 h-4" />
        <span className="text-sm">No houses available</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Home className="w-4 h-4 text-gray-600" />
      <Select
        value={selectedHouse?.id || ""}
        onValueChange={(value) => {
          const house = houses.find((h) => h.id === value)
          if (house) {
            setSelectedHouse(house)
          }
        }}
      >
        <SelectTrigger className="w-[200px] h-9">
          <SelectValue placeholder="Select a house">
            {selectedHouse?.name || "Select a house"}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {houses.map((house) => (
            <SelectItem key={house.id} value={house.id}>
              {house.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
