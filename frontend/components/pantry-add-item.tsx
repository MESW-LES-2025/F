"use client"

import { useState } from "react"
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

export default function PantryAddItem() {
  const [name, setName] = useState("")
  const [quantity, setQuantity] = useState<number | "">("")
  const [unit, setUnit] = useState("unit")
  const [expiry, setExpiry] = useState("")
  const [category, setCategory] = useState("pantry")

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="bg-green-600 hover:bg-green-700">
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add pantry item</DialogTitle>
          <DialogDescription>
            Fill the item details. (This dialog is UI-only; Insert does not call the
            server yet.)
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
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="e.g. 1"
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
                  <SelectItem value="kg">Kg</SelectItem>
                  <SelectItem value="ml">Ml</SelectItem>
                  <SelectItem value="g">g</SelectItem>
                  <SelectItem value="unit">unit</SelectItem>
                  <SelectItem value="loaf">loaf</SelectItem>
                  <SelectItem value="bottle">bottle</SelectItem>
                  <SelectItem value="box">box</SelectItem>
                  <SelectItem value="other">other</SelectItem>
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
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select defaultValue={category} onValueChange={(v) => setCategory(v)}>
                <SelectTrigger id="category" className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dairy">Dairy</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="pantry">Pantry</SelectItem>
                  <SelectItem value="beverages">Beverages</SelectItem>
                  <SelectItem value="meat">Meat</SelectItem>
                  <SelectItem value="household">Household</SelectItem>
                  <SelectItem value="frozen">Frozen</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <DialogClose asChild>
            <Button
              onClick={() => {
                // no-op still
              }}
            >
              Insert
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
