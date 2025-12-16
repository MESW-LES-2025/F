"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { MetricsCards } from "@/components/metrics-cards";
import { ActivitiesBoard } from "@/components/activities-board";
import { useHouse } from "@/lib/house-context";

export default function HomePage() {
  const { selectedHouse, houses, isLoading } = useHouse();

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <DashboardHeader />
      <MetricsCards />
      <ActivitiesBoard />
    </div>
  );
}
