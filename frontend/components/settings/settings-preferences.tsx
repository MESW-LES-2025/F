"use client";

import { Globe } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function SettingsPreferences() {
  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Preferences</h2>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="language">Language</Label>
          <select
            id="language"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option>English</option>
            <option>Portuguese</option>
            <option>Spanish</option>
          </select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="currency">Currency</Label>
          <select
            id="currency"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2"
          >
            <option>EUR (€)</option>
            <option>USD ($)</option>
            <option>GBP (£)</option>
          </select>
        </div>
      </div>
    </Card>
  );
}
