import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { pantryItems as fallbackItems } from "@/lib/data"
import type { PantryItem } from "@/lib/types"
import { format } from "date-fns"
import { AlertCircle } from "lucide-react"

interface PantryGridProps {
  items?: PantryItem[]
}

export function PantryGrid({ items }: PantryGridProps) {
  const pantryItems = items ?? fallbackItems

  return (
    <div>
      <h2 className="text-sm font-semibold text-gray-900 mb-4">Pantry Items</h2>
      {pantryItems.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-200 p-6 text-center text-gray-600">
          <p className="mb-2">No pantry items found.</p>
          <p className="text-sm">You can add items using the "Add item" form.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {pantryItems.map((item) => {
          const isExpiringSoon =
            item.expiryDate &&
            Math.floor((item.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 7

          return (
            <Card key={item.id} className="p-4 bg-white border border-gray-200 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {item.category}
                  </Badge>
                </div>
                {item.lowStock && <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />}
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium text-gray-900">
                    {item.quantity} {item.unit}
                  </span>
                </div>

                {item.expiryDate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Expires:</span>
                    <span className={`font-medium ${isExpiringSoon ? "text-red-600" : "text-gray-900"}`}>
                      {format(item.expiryDate, "MMM d, yyyy")}
                    </span>
                  </div>
                )}

                {item.lowStock && (
                  <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                    <AlertCircle className="w-3 h-3" />
                    <span>Low stock - restock soon</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={item.addedByAvatar || "/placeholder.svg"} />
                  <AvatarFallback className="text-xs">
                    {item.addedBy
                      .split(" ")
                      .map((n) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-500">Added by {item.addedBy}</span>
              </div>
            </Card>
          )
        })}
        </div>
      )}
    </div>
  )
}
