"use client";

import { useEffect, useState } from "react";
import { houseService } from "@/lib/house-service";
import { House } from "@/lib/types";
import { HouseList } from "@/components/house-list";

export default function ChooseHousePage() {
  const [houses, setHouses] = useState<House[]>([]);

  useEffect(() => {
    async function loadHouses() {
      try {
        const response = await houseService.findAllUserHouses();
        setHouses(response);
      } catch (err) {
        console.error("Could not load houses: ", err);
      }
    }

    loadHouses();
  }, []);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Choose a house
        </h1>
        <p className="text-muted-foreground">
          Choose the house you want to go to
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6">
          <HouseList houses={houses} />
        </div>
      </div>
    </div>
  );
}
