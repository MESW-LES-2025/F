"use client";

import { useEffect, useState } from "react";
import { Calendar, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { profileService } from "@/lib/profile-service";
import type { User as UserType } from "@/lib/types";
import { userService } from "@/lib/user-service";

export function ProfileActivityOverview() {
  const [user, setUser] = useState<UserType | null>(null);
  const [tasks, setTasks] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [items, setItems] = useState(0);
  const [contributionLevel, setContributionLevel] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

    const fetchOverview = async () => {
      try {
        setIsLoading(true);
        const overview = await userService.activityOverview();
        setTasks(overview.tasksCompleted);
        setExpenses(overview.totalExpenses);
        setItems(overview.itemsAdded);
        setContributionLevel(overview.contributionLevel);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load overview"
        );
        console.error("Failed to fetch overview:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
    fetchOverview();
  }, []);

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

  return (
    <>
      <Card className="p-6">
        <h3 className="text-lg font-semibold">Activity Overview</h3>

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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 border border-border rounded-lg">
            <p className="text-3xl font-bold text-primary">{tasks}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tasks Completed
            </p>
          </div>
          <div className="text-center p-4 border border-border rounded-lg">
            <p className="text-3xl font-bold text-primary">€{expenses}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Expenses</p>
          </div>
          <div className="text-center p-4 border border-border rounded-lg">
            <p className="text-3xl font-bold text-primary">{items}</p>
            <p className="text-sm text-muted-foreground mt-1">Items Added</p>
          </div>
          <div className="text-center p-4 border border-border rounded-lg">
            <div className="flex justify-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((level) => (
                <Star
                  key={level}
                  className={`w-6 h-6 mt-1 mb-1 ${
                    level <= contributionLevel
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-muted-foreground"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">Contribution</p>
          </div>
        </div>
      </Card>
    </>
  );
}
