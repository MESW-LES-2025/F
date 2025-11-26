"use client";

import { HouseList } from "@/components/house/house-list";
import { HouseProvider } from "@/lib/house-context";

export default function SettingsPage() {
  return (
    <HouseProvider>
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
            <HouseList from={"login"} />
          </div>
        </div>
      </div>
    </HouseProvider>
  );
}
