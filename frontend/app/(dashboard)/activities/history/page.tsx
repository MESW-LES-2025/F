"use client";

import { useEffect, useMemo, useState } from "react";
import { getTasks, unarchiveTask } from "@/lib/tasks-service";
import type { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArchiveRestore, ArrowLeft, History } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";

export default function ActivitiesHistoryPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"new" | "old">("new");

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        setIsLoading(true);
        const archivedTasks = await getTasks({ archived: "true" });
        if (mounted) setTasks(archivedTasks);
      } catch (err) {
        console.error("Failed to load archived tasks", err);
        if (mounted) setError("Unable to load archived tasks.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const handleUnarchive = async (task: Task) => {
    try {
      const restored = await unarchiveTask(task.id);
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      toast({
        title: "Task unarchived",
        description: `${restored.title} returned to board.`,
      });
    } catch (err) {
      toast({
        title: "Unarchive failed",
        description: String((err as any)?.message || "Try again later."),
      });
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = [...tasks];
    base.sort((a, b) => {
      const at = a.archivedAt ? new Date(a.archivedAt).getTime() : 0;
      const bt = b.archivedAt ? new Date(b.archivedAt).getTime() : 0;
      return sort === "new" ? bt - at : at - bt;
    });
    if (!q) return base;
    return base.filter((t) => {
      const hay =
        `${t.title} ${t.description ?? ""} ${t.assignee ?? ""} ${t.houseName ?? ""}`.toLowerCase();
      return hay.includes(q);
    });
  }, [tasks, query, sort]);

  // Simple list only (no grouping yet per user feedback)

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Header />
        <div className="text-gray-500">Loading archived tasks...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 space-y-4">
        <Header />
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Header />
      {/* Actions Bar */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1"
            onClick={() => (window.location.href = "/activities")}
          >
            <ArrowLeft className="w-4 h-4" /> Board
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`gap-1 ${sort === "new" ? "bg-green-50 border-green-300" : "hover:bg-green-50"}`}
            onClick={() => setSort("new")}
          >
            <History className="w-4 h-4" /> Newest
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`gap-1 ${sort === "old" ? "bg-green-50 border-green-300" : "hover:bg-green-50"}`}
            onClick={() => setSort("old")}
          >
            <History className="w-4 h-4 rotate-180" /> Oldest
          </Button>
          <span className="text-xs text-gray-500 ml-1 mt-1">
            {filtered.length} archived
          </span>
        </div>
        <div className="w-full md:w-72">
          <Input
            placeholder="Search archived tasks..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <Card className="p-6 text-sm text-gray-600">
          No archived tasks yet.
        </Card>
      ) : (
        <CardGrid tasks={filtered} onUnarchive={handleUnarchive} />
      )}
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">Archived Tasks</h1>
        <p className="text-xs text-gray-500">
          Browse and restore completed work
        </p>
      </div>
    </div>
  );
}

function CardGrid({
  tasks,
  onUnarchive,
}: {
  tasks: Task[];
  onUnarchive: (t: Task) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {tasks.map((task) => (
        <Card key={task.id} className="p-4 border-l-4 border-l-gray-300">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {task.title}
                </p>
                <Badge variant="secondary">{task.houseName || "House"}</Badge>
              </div>
              {task.description && (
                <p className="text-xs text-gray-600 line-clamp-2">
                  {task.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Avatar className="w-6 h-6">
                  <AvatarImage src={task.assigneeAvatar} />
                  <AvatarFallback className="text-[10px]">
                    {(task.assignee || "?")
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">
                  {task.assignee || "Unassigned"}
                </span>
                {task.archivedAt && (
                  <span className="ml-auto text-gray-400">
                    {formatDistanceToNow(new Date(task.archivedAt), {
                      addSuffix: true,
                    })}
                  </span>
                )}
              </div>
            </div>
            <div className="shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onUnarchive(task)}
                className="gap-1"
              >
                <ArchiveRestore className="w-3.5 h-3.5" />
                Unarchive
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
