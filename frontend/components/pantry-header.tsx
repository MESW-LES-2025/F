"use client"

import PantryAddItem from "./pantry-add-item"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function PantryHeader() {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-lg font-semibold text-gray-900">Pantry - FEUP&apos;s Student House - C</h1>
          <PantryAddItem />
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Category:</span>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="dairy">Dairy</SelectItem>
                <SelectItem value="bakery">Bakery</SelectItem>
                <SelectItem value="grains">Grains</SelectItem>
                <SelectItem value="canned">Canned</SelectItem>
                <SelectItem value="oils">Oils</SelectItem>
                <SelectItem value="beverages">Beverages</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] h-9">
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
            <Select defaultValue="all">
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="sam">Sam Wheeler</SelectItem>
                <SelectItem value="joao">João Félix</SelectItem>
                <SelectItem value="marcos">Marcos Salgado</SelectItem>
                <SelectItem value="joana">Joana Maria</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}
