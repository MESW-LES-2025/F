"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { ProfileScroll } from "@/components/profile/profile-scroll";
import { HomeFeatureColumns } from "@/components/home/home-feature-columns";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { HouseProvider } from "@/lib/house-context";
import { HouseRedirect } from "@/components/house/house-redirect";

function HomeContent() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect unauthenticated users to login
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If not authenticated, don't render anything (will redirect above)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated - show dashboard
  return (
    <HouseProvider>
      <HouseRedirect />
      <div className="flex min-h-screen bg-gray-50">
        <AppSidebar />
        <main className="flex-1 lg:ml-40 pt-16 lg:pt-0">
          <div className="flex-1">
            <DashboardHeader />
            <ProfileScroll />
            <div className="p-4 md:p-6 space-y-6">
              <HomeFeatureColumns />
            </div>
          </div>
        </main>
      </div>
    </HouseProvider>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
