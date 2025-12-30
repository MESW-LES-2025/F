"use client";

import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MetricsCards } from "@/components/dashboard/metrics-cards";
import { ActivitiesBoard } from "@/components/activities/activities-board";

export default function HomePage() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <DashboardHeader />
      <MetricsCards />
      <ActivitiesBoard />
    </div>
  );
}
