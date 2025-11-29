"use client";

import { HouseList } from "@/components/house/house-list";
import { JoinHouseForm } from "@/components/house/house-join-form";
import { CreateHouseForm } from "@/components/house/house-create-form";

export default function SettingsPage() {
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
          <HouseList from={"management"} />
        </div>

        <JoinHouseForm />

        <CreateHouseForm />
      </div>
    </div>
  );
}
