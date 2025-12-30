"use client";

import { GetStartedSectionCard } from "@/components/get-started/section-card";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import {
  Calendar,
  Glasses,
  HousePlus,
  LayoutDashboard,
  MessageSquare,
  Users,
  Zap,
} from "lucide-react";

export default function GetStartedPage() {
  return (
    <>
      {/* Header */}
      <div className="border-b bg-background">
        <div className="px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Get Started</h1>
            <p className="text-sm text-muted-foreground">
              Everything you need to know to feel at home in Concordia
            </p>
          </div>
          <NotificationsBell />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 md:p-6 lg:p-8 space-y-8">
        {/* Overview */}
        <div className="max-w-3xl space-y-3 animate-in fade-in duration-500">
          <div className="flex items-center gap-2 text-primary">
            <Glasses className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Overview</h2>
          </div>

          <p className="text-muted-foreground leading-relaxed">
            Concordia is a complete house-management platform built to make
            shared living easier. Inside a house, you can organize expenses,
            activities, pantry items and communication — all in one place.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <GetStartedSectionCard
            icon={LayoutDashboard}
            title="Dashboard"
            description="Your home’s command center. Get a quick overview of ongoing activities, pantry status and the latest expenses as soon as you log in."
          />

          <GetStartedSectionCard
            icon={Zap}
            title="Expenses"
            description="Track and split house expenses effortlessly. Add new expenses, categorize them, filter by date and visualize spending trends over time."
          />

          <GetStartedSectionCard
            icon={Users}
            title="Pantry"
            description="A digital version of your real pantry. Keep track of items, quantities and expiration dates — and get notified before anything goes bad."
          />

          <GetStartedSectionCard
            icon={Calendar}
            title="Activities"
            description="Your house’s shared Kanban board. Create tasks, assign them to housemates and move them between To-do, Doing and Done."
          />

          <GetStartedSectionCard
            icon={MessageSquare}
            title="Chat"
            description="Talk to everyone in the house without leaving the app. Messages are delivered instantly so everyone stays on the same page."
          />

          <GetStartedSectionCard
            icon={HousePlus}
            title="Houses"
            description="Manage all your houses in one place. Create new houses, join with invite codes or switch between them anytime."
          />
        </div>
      </div>
    </>
  );
}
