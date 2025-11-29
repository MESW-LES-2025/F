'use client'

import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { NotificationsBell } from "@/components/notifications-bell"
import { ProtectedRoute } from "@/lib/protected-route"
import { HouseProvider } from "@/lib/house-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <HouseProvider>
        <div className="flex min-h-screen bg-gray-50">
          <AppSidebar />
          <main className="flex-1 lg:ml-40 pt-16 lg:pt-0 relative">
            <NotificationsBell className="fixed right-4 top-4 z-40" />
            {children}
          </main>
        </div>
      </HouseProvider>
    </ProtectedRoute>
  )
}
