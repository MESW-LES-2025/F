"use client"

import PantryAddItem from "./pantry-add-item"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Dispatch, SetStateAction } from "react"

interface PantryHeaderProps {
  category: string
  setCategory: Dispatch<SetStateAction<string>>
  status: string
  setStatus: Dispatch<SetStateAction<string>>
  addedBy: string
  setAddedBy: Dispatch<SetStateAction<string>>
}

export function PantryHeader({ category, setCategory, status, setStatus, addedBy, setAddedBy }: PantryHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Pantry</h1>
          <PantryAddItem />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Category:</span>
            <Select value={category} onValueChange={(v) => setCategory(v)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
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

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <Select value={status} onValueChange={(v) => setStatus(v)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="expiring-soon">Expiring Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Added By:</span>
            <Select value={addedBy} onValueChange={(v) => setAddedBy(v)}>
              <SelectTrigger className="w-[160px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="me">Me</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
