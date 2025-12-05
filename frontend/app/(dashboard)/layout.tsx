'use client'

import type React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ProtectedRoute } from "@/lib/protected-route"
import { HouseProvider } from "@/lib/house-context"

import { HouseRedirect } from "@/components/house/house-redirect"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedRoute>
      <HouseProvider>
        <HouseRedirect />
        <div className="flex min-h-screen bg-gray-50">
          <AppSidebar />
          <main className="flex-1 lg:ml-40 pt-16 lg:pt-0">
            {children}
          </main>
        </div>
      </HouseProvider>
    </ProtectedRoute>
  )
}
