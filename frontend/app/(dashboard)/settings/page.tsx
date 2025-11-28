"use client";

import SettingsNotifications from "@/components/settings/settings-notifications";
import AccountSettings from "@/components/settings/settings-account";
import SettingsPreferences from "@/components/settings/settings-preferences";
import SettingsSecurity from "@/components/settings/settings-security";
import SettingsDangerArea from "@/components/settings/settings-danger-area";

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
        <SettingsNotifications />

        {/* Preferences */}
        <SettingsPreferences />

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
        <SettingsDangerArea />
      </div>
    </div>
  );
}
