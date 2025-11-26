"use client";

import { useEffect, useState } from "react";
import { houseService } from "@/lib/house-service";
import { House } from "@/lib/types";
import { HouseList } from "@/components/house/house-list";
import { JoinHouseForm } from "@/components/house/house-join-form";
import { CreateHouseForm } from "@/components/house/house-create-form";

export default function SettingsPage() {
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
          House Management
        </h1>
        <p className="text-muted-foreground">
          Manage your houses or join/create a new one
        </p>
      </div>

      <div className="grid gap-6">
        <div className="grid gap-6">
          <HouseList houses={houses} />
        </div>

        <JoinHouseForm />

        <CreateHouseForm />
      </div>
    </div>
  );
}
