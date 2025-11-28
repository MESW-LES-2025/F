"use client";

import SettingsNotifications from "@/components/settings/settings-notifications";
import AccountSettings from "@/components/settings/settings-account";
import SettingsPreferences from "@/components/settings/settings-preferences";
import SettingsSecurity from "@/components/settings/settings-security";
import SettingsDangerArea from "@/components/settings/settings-danger-area";
import { useRouter } from "next/navigation";
import { DoorOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SettingsWithoutHousePage() {
  const router = useRouter();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="space-y-2 flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground">
            Manage your account and preferences
          </p>
        </div>

        <div>
          <Button
            onClick={() => router.push("/join-house")}
            className="inline-flex items-center text-sm transition-colors"
          >
            <DoorOpen className="w-4 h-4 mr-2" />
            Join a House
          </Button>
        </div>
      </div>

      <div className="grid gap-6">
        {/* Account Settings */}
        <AccountSettings />

        {/* Notifications */}
        <SettingsNotifications />

        {/* Preferences */}
        <SettingsPreferences />

        {/* Security */}
        <SettingsSecurity />

        {/* Danger Zone */}
        <SettingsDangerArea />
      </div>
    </div>
  );
}
