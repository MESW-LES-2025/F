import { Card } from "@/components/ui/card"
import { pantryItems } from "@/lib/data"
import { Package, AlertTriangle, Calendar } from "lucide-react"

export function PantryStats() {
  const totalItems = pantryItems.length
  const lowStockItems = pantryItems.filter((item) => item.lowStock).length
  const expiringItems = pantryItems.filter((item) => {
    if (!item.expiryDate) return false
    const daysUntilExpiry = Math.floor((item.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry >= 0
  }).length

  const categories = [...new Set(pantryItems.map((item) => item.category))].length

  return (
    <div className="grid grid-cols-4 gap-4">
      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Low Stock</p>
            <p className="text-2xl font-bold text-gray-900">{lowStockItems}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <Calendar className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Expiring Soon</p>
            <p className="text-2xl font-bold text-gray-900">{expiringItems}</p>
          </div>
        </div>
      </Card>

      <Card className="p-4 bg-white border border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
            <Package className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-600">Categories</p>
            <p className="text-2xl font-bold text-gray-900">{categories}</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
