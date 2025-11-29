"use client";

import { Settings } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Input } from "../ui/input";
import { useState, useEffect, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { profileService } from "@/lib/profile-service";

export default function AccountSettings() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name ?? "");
      setEmail(user.email ?? "");
      setUsername(user.username ?? "");
    }
  }, [user]);

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-5 h-5 text-primary" />
        <h2 className="text-xl font-semibold">Account Settings</h2>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={email}
            disabled
            className="bg-muted text-muted-foreground cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Email cannot be changed
          </p>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setUsername(e.target.value)
            }
          />
        </div>
        <Button
          onClick={async () => {
            setError(null);
            setSuccessMessage(null);

            if (!name || !username) {
              setError("Please fill in all fields");
              return;
            }

            setIsSaving(true);
            try {
              // Don't send email in update
              const updated = await profileService.updateProfile({
                name,
                username,
              });
              setSuccessMessage("Profile updated successfully");
              // Update auth context and session cache
              try {
                updateUser(updated);
              } catch (e) {
                /* ignore */
              }
            } catch (err) {
              setError(
                err instanceof Error ? err.message : "Failed to update profile"
              );
            } finally {
              setIsSaving(false);
            }
          }}
          disabled={isSaving}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </Card>
  );
}
