"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getDashboardSummary, type DashboardSummary } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && user.role !== "admin") {
      router.replace("/customers");
    }
  }, [user, router]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    getDashboardSummary()
      .then(setSummary)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, [user]);

  if (!user || user.role !== "admin") {
    return null;
  }

  const stats = [
    { label: "Total Customers", value: summary?.totalCustomers },
    { label: "Total Agents", value: summary?.totalAgents },
    {
      label: "Total To Collect",
      value: summary ? formatCurrency(summary.totalToCollect) : undefined,
    },
    {
      label: "Total Collected",
      value: summary ? formatCurrency(summary.totalCollected) : undefined,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-muted-foreground">Overview of the coupon-lottery program.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <p className="text-2xl font-bold">{stat.value ?? "-"}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
