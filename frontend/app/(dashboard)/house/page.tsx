"use client";

import { HouseList } from "@/components/house/house-list";
import { JoinHouseForm } from "@/components/house/house-join-form";
import { CreateHouseForm } from "@/components/house/house-create-form";
import { NotificationsBell } from "@/components/notifications-bell";

export default function SettingsPage() {
  return (
    <>
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 md:px-6 py-4 flex items-center justify-between">
          <h1 className="text-base md:text-lg font-semibold text-gray-900">
            House Management
          </h1>
          <NotificationsBell />
        </div>
      </div>

      <div className="p-4 md:p-6 lg:p-8 space-y-6">
        <div className="space-y-2">
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
    </>
  );
}
