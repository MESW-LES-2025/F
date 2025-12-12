"use client";

import { useEffect, useState, useRef } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Edit2,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { profileService } from "@/lib/profile-service";
import type { User as UserType } from "@/lib/types";

export function ProfileContent() {
  const [user, setUser] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { updateUser } = useAuth();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);
        const profileData = await profileService.getProfile();
        setUser(profileData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
        console.error("Failed to fetch profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please select an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      toast({
        title: "File too large",
        description: "Please select an image smaller than 5MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const updatedUser = await profileService.uploadImage(file);
      setUser(updatedUser);
      updateUser(updatedUser); // Update global auth context so sidebar reflects the change
      toast({
        title: "Success",
        description: "Profile image updated successfully",
      });
    } catch (err) {
      toast({
        title: "Upload failed",
        description:
          err instanceof Error ? err.message : "Failed to upload image",
        variant: "destructive",
      });
      console.error("Failed to upload image:", err);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!user) {
    return (
      <Alert>
        <AlertDescription>No user profile found</AlertDescription>
      </Alert>
    );
  }

  // Get initials for avatar fallback
  const initials = user.name
    .split(" ")
    .map((n: string) => n[0])
    .join("")
    .toUpperCase();

  return (
    <div className="grid gap-6 max-w-4xl">
      {/* Profile Header */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="relative group">
            <Avatar className="w-24 h-24">
              <AvatarImage
                src={user.imageUrl || "/placeholder-user.jpg"}
                alt={user.name}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <button
              onClick={handleImageClick}
              disabled={isUploading}
              className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <Badge variant="secondary">User</Badge>
            </div>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-semibold">Personal Information</h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <User className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Full Name</p>
              <p className="font-medium">{user.name}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <Mail className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-border rounded-lg">
            <MapPin className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Username</p>
              <p className="font-medium">{user.username}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 border border-border rounded-lg md:col-span-2">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Member since</p>
              <p className="font-medium text-xs">
                {user.createdAt
                  ? new Date(user.createdAt).toLocaleDateString()
                  : "—"}
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Activity Stats */}
      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-semibold">Activity Overview</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-border rounded-lg">
            <p className="text-3xl font-bold text-primary">12</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tasks Completed
            </p>
          </div>
          <div className="text-center p-4 border border-border rounded-lg">
            <p className="text-3xl font-bold text-primary">€245</p>
            <p className="text-sm text-muted-foreground mt-1">Total Expenses</p>
          </div>
          <div className="text-center p-4 border border-border rounded-lg">
            <p className="text-3xl font-bold text-primary">8</p>
            <p className="text-sm text-muted-foreground mt-1">Items Added</p>
          </div>
          <div className="text-center p-4 border border-border rounded-lg">
            <p className="text-3xl font-bold text-primary">95%</p>
            <p className="text-sm text-muted-foreground mt-1">Contribution</p>
          </div>
        </div>
      </Card>

      {/* Recent Activity */}
      <Card className="p-6 space-y-6">
        <h3 className="text-lg font-semibold">Recent Activity</h3>

        <div className="space-y-4">
          {[
            {
              action: "Completed task",
              detail: "Clean the Kitchen",
              time: "2 hours ago",
            },
            {
              action: "Added expense",
              detail: "Groceries - €45.50",
              time: "5 hours ago",
            },
            {
              action: "Updated pantry",
              detail: "Added Milk, Bread",
              time: "1 day ago",
            },
            {
              action: "Completed task",
              detail: "Take out the trash",
              time: "2 days ago",
            },
          ].map((activity, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 border border-border rounded-lg"
            >
              <div className="w-2 h-2 rounded-full bg-primary mt-2" />
              <div className="flex-1">
                <p className="font-medium">{activity.action}</p>
                <p className="text-sm text-muted-foreground">
                  {activity.detail}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{activity.time}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
