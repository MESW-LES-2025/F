"use client";

import { useState, useEffect } from "react";
import PantryContainer from "@/components/pantry/pantry-container";
import type { PantryItem } from "@/lib/types";
import { getPantryItems } from "@/lib/pantry-service";
import { useHouse } from "@/lib/house-context";
import { apiGet } from "@/lib/api-client";

interface PantryResponse {
  id: string;
  houseId: string;
}

export default function PantryPage() {
  const { selectedHouse } = useHouse();
  const [items, setItems] = useState<PantryItem[]>([]);
  const [pantryId, setPantryId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPantryItems();
  }, [selectedHouse]);

  const loadPantryItems = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedHouse) {
        setItems([]);
        setPantryId(null);
        setIsLoading(false);
        return;
      }

      // Fetch pantries to get the pantry ID for this house
      const pantries = await apiGet<PantryResponse[]>("/pantry", {
        requiresAuth: true,
      });
      const housePantry = pantries.find((p) => p.houseId === selectedHouse.id);

      if (housePantry) {
        setPantryId(housePantry.id);
      } else {
        setPantryId(null);
      }

      const fetchedItems = await getPantryItems(selectedHouse.id);
      setItems(fetchedItems);
    } catch (err) {
      console.error("Failed to load pantry items:", err);
      setError("Failed to load pantry items. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Loading pantry items...</p>
        </div>
      </div>
    );
  }

  if (!selectedHouse) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-gray-500 mb-2">No house selected</p>
            <p className="text-sm text-gray-400">
              Please select a house to view pantry items
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <button
              onClick={loadPantryItems}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <PantryContainer
      items={items}
      pantryHouseId={selectedHouse.id}
      pantryId={pantryId || undefined}
      onItemAdded={loadPantryItems}
    />
  );
}
