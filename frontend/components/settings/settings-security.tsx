"use client";

import { useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";

export default function SettingsSecurity() {
  const { user } = useAuth();
  const router = useRouter();
  const { logout, changePassword } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  return (
    <>
      {!user?.googleId && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Security</h2>
          </div>

          <div className="space-y-4">
            {/* show success or error messages for password change */}
            {successMessage && (
              <Alert>
                <AlertDescription>{successMessage}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setCurrentPassword(e.target.value)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setNewPassword(e.target.value)
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setConfirmPassword(e.target.value)
                }
              />
            </div>
            <Button
              onClick={async () => {
                setError(null);
                setSuccessMessage(null);

                if (!currentPassword || !newPassword || !confirmPassword) {
                  setError("Please fill in all password fields");
                  return;
                }

                if (newPassword !== confirmPassword) {
                  setError("New passwords do not match");
                  return;
                }

                setChangingPassword(true);
                try {
                  await changePassword(currentPassword, newPassword);
                  setSuccessMessage(
                    "Password updated successfully. You will be logged out to re-authenticate.",
                  );

                  // force logout so user re-authenticates with the new password
                  await logout();
                  router.push("/login");
                } catch (err) {
                  setError(
                    err instanceof Error
                      ? err.message
                      : "Failed to update password",
                  );
                } finally {
                  setChangingPassword(false);
                }
              }}
              disabled={changingPassword}
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </Button>
          </div>
        </Card>
      )}
    </>
  );
}
