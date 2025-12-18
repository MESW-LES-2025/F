"use client";

import { useMemo, useState } from "react";
import type { PantryItem } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { PantryHeader } from "./pantry-header";
import { PantryStats } from "./pantry-stats";
import { PantryGrid } from "./pantry-grid";

interface Props {
  items?: PantryItem[];
  pantryHouseId?: string | undefined;
  pantryId?: string | undefined;
  onItemAdded?: () => void;
}

export default function PantryContainer({
  items,
  pantryHouseId,
  pantryId,
  onItemAdded,
}: Props) {
  const list = items ?? [];
  const [category, setCategory] = useState<string>("all");
  const [status, setStatus] = useState<string>("all");
  const [addedBy, setAddedBy] = useState<string>("all");

  const { user } = useAuth();

  const filtered = useMemo(() => {
    const now = new Date();
    const currentUserName = user?.name?.toLowerCase() ?? null;

    return list.filter((it) => {
      // category filter
      if (category !== "all" && it.category !== category) return false;

      // addedBy filter - use actual current user name when available
      if (addedBy === "me") {
        if (!currentUserName) return false;
        if (!it.addedBy) return false;
        if (it.addedBy.toLowerCase().includes(currentUserName) === false)
          return false;
      } else if (addedBy === "others") {
        if (
          currentUserName &&
          it.addedBy &&
          it.addedBy.toLowerCase().includes(currentUserName)
        )
          return false;
      }

      // status filter
      if (status === "low-stock") {
        if (!it.lowStock) return false;
      } else if (status === "expiring-soon") {
        if (!it.expiryDate) return false;
        const days = Math.ceil(
          (it.expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (days > 7) return false;
      } else if (status === "in-stock") {
        if (it.quantity <= 0) return false;
      }

      return true;
    });
  }, [list, category, status, addedBy, user]);

  return (
    <>
      <PantryHeader
        category={category}
        setCategory={setCategory}
        status={status}
        setStatus={setStatus}
        addedBy={addedBy}
        setAddedBy={setAddedBy}
        onItemAdded={onItemAdded}
      />

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <PantryStats items={filtered} />

        <PantryGrid
          items={filtered}
          pantryHouseId={pantryHouseId}
          pantryId={pantryId}
        />
      </div>
    </>
  );
}
