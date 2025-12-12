"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getSpendingTrends, type SpendingTrend } from "@/lib/expense-service";
import { Loader2 } from "lucide-react";

interface SpendingTrendsChartProps {
  houseId: string;
}

export function SpendingTrendsChart({ houseId }: SpendingTrendsChartProps) {
  const [data, setData] = useState<SpendingTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [days, setDays] = useState<number>(30);

  useEffect(() => {
    const fetchTrends = async () => {
      try {
        setLoading(true);
        const response = await getSpendingTrends(houseId, period, days);
        setData(response.data);
      } catch (error) {
        console.error("Failed to fetch spending trends:", error);
      } finally {
        setLoading(false);
      }
    };

    if (houseId) {
      fetchTrends();
    }
  }, [houseId, period, days]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    if (period === "month") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
      });
    } else if (period === "week") {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Spending Trends</CardTitle>
            <CardDescription>Track your spending over time</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select
              value={period}
              onValueChange={(v) => setPeriod(v as "day" | "week" | "month")}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Daily</SelectItem>
                <SelectItem value="week">Weekly</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={days.toString()}
              onValueChange={(v) => setDays(parseInt(v))}
            >
              <SelectTrigger className="w-[110px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">7 days</SelectItem>
                <SelectItem value="30">30 days</SelectItem>
                <SelectItem value="90">90 days</SelectItem>
                <SelectItem value="180">180 days</SelectItem>
                <SelectItem value="365">1 year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={formatDate}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip
                formatter={(value: number) => [`$${value.toFixed(2)}`, "Total"]}
                labelFormatter={formatDate}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="var(--primary)"
                strokeWidth={2}
                dot={{ fill: "var(--primary)" }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            No spending data available for the selected period
          </div>
        )}
      </CardContent>
    </Card>
  );
}
