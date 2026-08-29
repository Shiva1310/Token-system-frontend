"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { getDashboardSummary, type DashboardSummary } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, UserCog, Wallet, PiggyBank, type LucideIcon } from "lucide-react";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Stat {
  label: string;
  value: string | number | undefined;
  icon: LucideIcon;
  accent: string;
}

const MONTH_LABELS = [
  "Aug 2026",
  "Sep 2026",
  "Oct 2026",
  "Nov 2026",
  "Dec 2026",
  "Jan 2027",
];

interface MonthRow {
  monthIndex: number;
  label: string;
  toCollect: number;
  collected: number;
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

  const stats: Stat[] = [
    {
      label: "Total Customers",
      value: summary?.totalCustomers,
      icon: Users,
      accent: "bg-blue-100 text-blue-600",
    },
    {
      label: "Total Agents",
      value: summary?.totalAgents,
      icon: UserCog,
      accent: "bg-purple-100 text-purple-600",
    },
    {
      label: "Total To Collect",
      value: summary ? formatCurrency(summary.totalToCollect) : undefined,
      icon: Wallet,
      accent: "bg-amber-100 text-amber-600",
    },
    {
      label: "Total Collected",
      value: summary ? formatCurrency(summary.totalCollected) : undefined,
      icon: PiggyBank,
      accent: "bg-green-100 text-green-600",
    },
  ];

  const monthRows: MonthRow[] = MONTH_LABELS.map((label, idx) => {
    const monthIndex = idx + 1;
    const match = summary?.monthlyBreakdown.find((m) => m.monthIndex === monthIndex);
    return {
      monthIndex,
      label,
      toCollect: match?.toCollect ?? 0,
      collected: match?.collected ?? 0,
    };
  });

  const monthColumns: DataTableColumn<MonthRow>[] = [
    { key: "month", header: "Month", cell: (m) => m.label },
    {
      key: "toCollect",
      header: "Amount To Collect",
      cell: (m) => formatCurrency(m.toCollect),
    },
    {
      key: "collected",
      header: "Amount Collected",
      cell: (m) => (
        <span className="font-medium text-green-700">{formatCurrency(m.collected)}</span>
      ),
    },
    {
      key: "outstanding",
      header: "Outstanding",
      cell: (m) => {
        const outstanding = m.toCollect - m.collected;
        return (
          <span className={outstanding > 0 ? "text-red-600" : "text-muted-foreground"}>
            {formatCurrency(outstanding)}
          </span>
        );
      },
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
            <CardHeader className="flex-row items-start justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <div className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${stat.accent}`}>
                <stat.icon className="size-4.5" />
              </div>
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

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Monthly Breakdown</h2>
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <DataTable columns={monthColumns} data={monthRows} rowKey={(m) => String(m.monthIndex)} />
        )}
      </div>
    </div>
  );
}
