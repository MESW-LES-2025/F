"use client"

import { useState, useEffect, type ChangeEvent } from "react"
import { useRouter } from "next/navigation"
import { Settings, Bell, Globe, Shield, Trash2, LogOut } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useAuth } from "@/lib/auth-context"
import { profileService } from "@/lib/profile-service"

export default function SettingsPage() {
  const router = useRouter()
  const { logout, user, changePassword, logoutAllDevices, updateUser } = useAuth()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [logoutAllLoading, setLogoutAllLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

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
      await logoutAllDevices()

      // Redirect to login after clearing tokens
      router.push("/login")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to logout from all devices")
    } finally {
      setLogoutAllLoading(false)
    }
  }
  useEffect(() => {
    if (user) {
      setName(user.name ?? '')
      setEmail(user.email ?? '')
      setUsername(user.username ?? '')
    }
  }, [user])
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
              <Input id="name" value={name} onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)} />
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
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" value={username} onChange={(e: ChangeEvent<HTMLInputElement>) => setUsername(e.target.value)} />
            </div>
            <Button
              onClick={async () => {
                setError(null)
                setSuccessMessage(null)

                if (!name || !username) {
                  setError('Please fill in all fields')
                  return
                }

                setIsSaving(true)
                try {
                  // Don't send email in update
                  const updated = await profileService.updateProfile({ name, username })
                  setSuccessMessage('Profile updated successfully')
                  // Update auth context and session cache
                  try { updateUser(updated) } catch (e) { /* ignore */ }
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Failed to update profile')
                } finally {
                  setIsSaving(false)
                }
              }}
              disabled={isSaving}
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
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

        {/* Security - Hide for Google users */}
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
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                onClick={async () => {
                  setError(null)
                  setSuccessMessage(null)

                  if (!currentPassword || !newPassword || !confirmPassword) {
                    setError("Please fill in all password fields")
                    return
                  }

                  if (newPassword !== confirmPassword) {
                    setError("New passwords do not match")
                    return
                  }

                  setChangingPassword(true)
                  try {
                    await changePassword(currentPassword, newPassword)
                    setSuccessMessage('Password updated successfully. You will be logged out to re-authenticate.')

                    // force logout so user re-authenticates with the new password
                    await logout()
                    router.push('/login')
                  } catch (err) {
                    setError(err instanceof Error ? err.message : 'Failed to update password')
                  } finally {
                    setChangingPassword(false)
                  }
                }}
                disabled={changingPassword}
              >
                {changingPassword ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </Card>
        )}

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
              <div>
                <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)} disabled={deleting}>
                  Delete Account
                </Button>

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete account</DialogTitle>
                      <DialogDescription>
                        This action is permanent and will remove all your data. This cannot be undone.
                      </DialogDescription>
                    </DialogHeader>

                    {deleteError && (
                      <Alert variant="destructive">
                        <AlertDescription>{deleteError}</AlertDescription>
                      </Alert>
                    )}

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={async () => {
                          setError(null)
                          setDeleteError(null)
                          setDeleting(true)
                          try {
                            await profileService.deleteAccount()
                            // ensure auth state cleared
                            try { await logout() } catch (e) { /* ignore */ }
                            router.push('/login')
                          } catch (err) {
                            setDeleteError(err instanceof Error ? err.message : 'Failed to delete account')
                          } finally {
                            setDeleting(false)
                            setDeleteDialogOpen(false)
                          }
                        }}
                        disabled={deleting}
                      >
                        {deleting ? 'Deleting...' : 'Delete account'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
