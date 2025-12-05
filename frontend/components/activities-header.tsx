"use client";

import { CreateTaskDialog } from "@/components/create-task-dialog";
import { HouseSelector } from "@/components/house/house-selector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";

interface ActivitiesHeaderProps {
  onTaskCreated?: (task: Task) => void;
  timeframe?: string;
  assignee?: string;
  status?: string;
  size?: "all" | "SMALL" | "MEDIUM" | "LARGE" | "XL";
  assignees?: string[];
  onTimeframeChange?: (value: string) => void;
  onAssigneeChange?: (value: string) => void;
  onStatusChange?: (value: string) => void;
  onSizeChange?: (value: "all" | "SMALL" | "MEDIUM" | "LARGE" | "XL") => void;
}

export function ActivitiesHeader({
  onTaskCreated,
  timeframe = "all",
  assignee = "all",
  status = "all",
  size = "all",
  assignees = [],
  onTimeframeChange,
  onAssigneeChange,
  onStatusChange,
  onSizeChange,
}: ActivitiesHeaderProps) {
  return (
    <div className="bg-white border-b border-gray-200/80">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">
                Activities
              </h1>
              <p className="text-xs text-gray-500">
                Plan, track, and complete tasks across your house
              </p>
            </div>
            <HouseSelector />
          </div>
          <div className="flex items-center gap-2">
            <Link href="/activities/history">
              <Button variant="ghost" size="sm" className="gap-1">
                <History className="w-4 h-4" /> History
              </Button>
            </Link>
            <CreateTaskDialog onTaskCreated={onTaskCreated} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Timeframe:</span>
            <Select
              value={timeframe}
              onValueChange={(v) => onTimeframeChange?.(v)}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="this-week">This Week</SelectItem>
                <SelectItem value="this-month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Assignee:</span>
            <Select
              value={assignee}
              onValueChange={(v) => onAssigneeChange?.(v)}
            >
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {assignees.map((a) => (
                  <SelectItem key={a} value={a}>
                    {a}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Status:</span>
            <Select value={status} onValueChange={(v) => onStatusChange?.(v)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="todo">To-do</SelectItem>
                <SelectItem value="doing">Doing</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Size:</span>
            <Select value={size} onValueChange={(v) => onSizeChange?.(v as any)}>
              <SelectTrigger className="w-[140px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="SMALL">Small</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="LARGE">Large</SelectItem>
                <SelectItem value="XL">XL</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  );
}
