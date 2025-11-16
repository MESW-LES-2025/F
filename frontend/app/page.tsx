"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState, Suspense } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { MetricsCards } from "@/components/metrics-cards";
import { ActivitiesBoard } from "@/components/activities-board";
import { AppSidebar } from "@/components/app-sidebar";
import { houseService } from "@/lib/house-service";
import { House } from "@/lib/types";

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentHouse, setCurrentHouse] = useState<House | null>(null);
  const [userHouses, setUserHouses] = useState<House[] | null>(null);
  const [loadingHouse, setLoadingHouse] = useState(false);

  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Redirect unauthenticated users to login
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const fetchHouse = async () => {
      const houseId = searchParams.get("houseId");
      if (!houseId) return;

      setLoadingHouse(true);
      try {
        const data = await houseService.findAllUserHouses();
        const currentHouse =
          data.find((house) => house.id == houseId) ?? data[0];
        setCurrentHouse(currentHouse);
        setUserHouses(data);
      } catch (err) {
        console.error("Failed to fetch houses: ", err);
      } finally {
        setLoadingHouse(false);
      }
    };

    fetchHouse();
  }, [searchParams]);

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
    <div className="flex min-h-screen bg-gray-50">
      <AppSidebar houses={userHouses ?? []} currentHouse={currentHouse} />
      <main className="flex-1 lg:ml-40 pt-16 lg:pt-0">
        <div className="flex-1">
          <DashboardHeader
            currentHouse={currentHouse}
            userHouses={userHouses}
            router={router}
          />
          <div className="p-4 md:p-6 space-y-6">
            <MetricsCards house={currentHouse} />
            <ActivitiesBoard house={currentHouse} />
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent />
    </Suspense>
  );
}
