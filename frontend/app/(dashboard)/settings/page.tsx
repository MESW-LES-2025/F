"use client";

import SettingsSecurity from "@/components/settings/settings-security";
import SettingsDangerArea from "@/components/settings/settings-danger-area";
import AccountSettings from "@/components/settings/settings-account";
import SettingsNotifications from "@/components/settings/settings-notifications";

export default function SettingsPage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Account Settings */}
        <AccountSettings />

        {/* Security - Hide for Google users */}
        <SettingsSecurity />

        {/* Danger Zone */}
        <SettingsDangerArea />
      </div>
    </div>
  );
}
