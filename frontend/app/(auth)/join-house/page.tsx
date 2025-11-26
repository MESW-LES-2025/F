"use client";

import { JoinHouseForm } from "@/components/house/house-join-form";
import { CreateHouseForm } from "@/components/house-create-form";

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Join a house!
        </h1>
        <p className="text-muted-foreground">
          Create a new house or join an existing one
        </p>
      </div>

      <div className="grid gap-6">
        <JoinHouseForm isRegister={true} />

        <CreateHouseForm isRegister={true} />
      </div>
    </div>
  );
}
