import { ProfileContent } from "@/components/profile/profile-content";

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          Profile
        </h1>
        <p className="text-muted-foreground">
          Manage your personal information
        </p>
      </div>

      <ProfileContent />
    </div>
  );
}
