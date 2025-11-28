"use client";

import { Bell } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";

export default function SettingsNotifications() {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Bell className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Notifications</h2>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Email Notifications</Label>
            <p className="text-sm text-muted-foreground">
              Receive email updates about activities
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Task Reminders</Label>
            <p className="text-sm text-muted-foreground">
              Get reminded about pending tasks
            </p>
          </div>
          <Switch defaultChecked />
        </div>
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label>Expense Alerts</Label>
            <p className="text-sm text-muted-foreground">
              Notifications for new expenses
            </p>
          </div>
          <Switch />
        </div>
      </div>
    </Card>
  );
}
