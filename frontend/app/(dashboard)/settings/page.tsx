"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Settings, Bell, Globe, Shield, Trash2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { apiPost } from "@/lib/api-client"

export default function SettingsPage() {
  const router = useRouter()
  const { logout, user } = useAuth()
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutAllLoading, setLogoutAllLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogout = async () => {
    setError(null)
    setIsLoggingOut(true)
    try {
      await logout()
      router.push("/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Logout failed")
    } finally {
      setIsLoggingOut(false)
    }
  }

  const handleLogoutAllDevices = async () => {
    if (!user?.id) return

    setError(null)
    setLogoutAllLoading(true)
    try {
      await apiPost('/auth/logout-all', {}, { requiresAuth: true })

      // Clear local storage and redirect
      await logout()
      router.push("/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout from all devices")
    } finally {
      setLogoutAllLoading(false)
    }
  }
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <div className="grid gap-6 max-w-4xl">
        {/* Account Settings */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Account Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue="Sam Wheeler" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue="sam@example.com" />
            </div>
            <Button>Save Changes</Button>
          </div>
        </Card>

        {/* Notifications */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive email updates about activities</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Task Reminders</Label>
                <p className="text-sm text-muted-foreground">Get reminded about pending tasks</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Expense Alerts</Label>
                <p className="text-sm text-muted-foreground">Notifications for new expenses</p>
              </div>
              <Switch />
            </div>
          </div>
        </Card>

        {/* Preferences */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Globe className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Preferences</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="language">Language</Label>
              <select id="language" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                <option>English</option>
                <option>Portuguese</option>
                <option>Spanish</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="currency">Currency</Label>
              <select id="currency" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2">
                <option>EUR (€)</option>
                <option>USD ($)</option>
                <option>GBP (£)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Security */}
        <Card className="p-6 space-y-6">
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-semibold">Security</h2>
          </div>

          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
            <Button>Update Password</Button>
          </div>
        </Card>

        {/* Danger Zone */}
        <Card className="p-6 space-y-6 border-destructive/50">
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
                <p className="text-sm text-muted-foreground">Sign out of your account on this device</p>
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
                <p className="text-sm text-muted-foreground">Sign out from all devices and invalidate all sessions</p>
                <p className="text-xs text-muted-foreground mt-2">Note: It may take up to 15 minutes for this action to take effect on all devices.</p>
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
                <p className="text-sm text-muted-foreground">Permanently delete your account and all data</p>
              </div>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
