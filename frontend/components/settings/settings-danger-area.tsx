"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/lib/auth-context";
import { profileService } from "@/lib/profile-service";

export default function SettingsDangerArea() {
  const router = useRouter();
  const { logout, user, logoutAllDevices } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutAllLoading, setLogoutAllLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleLogout = async () => {
    setError(null);
    setIsLoggingOut(true);
    try {
      await logout();
      router.push("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed");
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    if (!user?.id) return;

    setError(null);
    setLogoutAllLoading(true);
    try {
      await logoutAllDevices();

      // Redirect to login after clearing tokens
      router.push("/login");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to logout from all devices"
      );
    } finally {
      setLogoutAllLoading(false);
    }
  };

  return (
    <Card className="p-6 border-destructive/50">
      <div className="flex items-center gap-3">
        <Trash2 className="w-5 h-5 text-destructive" />
        <h2 className="text-xl font-semibold text-destructive">Danger Zone</h2>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border border-border rounded-lg">
          <div className="space-y-0.5">
            <Label>Log Out</Label>
            <p className="text-sm text-muted-foreground">
              Sign out of your account on this device
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {isLoggingOut ? "Logging out..." : "Log Out"}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-destructive">Log Out All Devices</Label>
            <p className="text-sm text-muted-foreground">
              Sign out from all devices and invalidate all sessions
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Note: It may take up to 15 minutes for this action to take effect
              on all devices.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleLogoutAllDevices}
            disabled={logoutAllLoading}
          >
            <LogOut className="w-4 h-4 mr-2" />
            {logoutAllLoading ? "Logging out..." : "Log Out All"}
          </Button>
        </div>

        <div className="flex items-center justify-between p-4 border border-destructive/50 rounded-lg">
          <div className="space-y-0.5">
            <Label className="text-destructive">Delete Account</Label>
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all data
            </p>
          </div>
          <div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={deleting}
            >
              Delete Account
            </Button>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete account</DialogTitle>
                  <DialogDescription>
                    This action is permanent and will remove all your data. This
                    cannot be undone.
                  </DialogDescription>
                </DialogHeader>

                {deleteError && (
                  <Alert variant="destructive">
                    <AlertDescription>{deleteError}</AlertDescription>
                  </Alert>
                )}

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={deleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      setError(null);
                      setDeleteError(null);
                      setDeleting(true);
                      try {
                        await profileService.deleteAccount();
                        // ensure auth state cleared
                        try {
                          await logout();
                        } catch (e) {
                          /* ignore */
                        }
                        router.push("/login");
                      } catch (err) {
                        setDeleteError(
                          err instanceof Error
                            ? err.message
                            : "Failed to delete account"
                        );
                      } finally {
                        setDeleting(false);
                        setDeleteDialogOpen(false);
                      }
                    }}
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </Card>
  );
}
