"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, deleteAgent, getAgents, type Agent } from "@/lib/api";
import { exportToExcel, exportToPdf, type ExportColumn } from "@/lib/export";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EntityCard } from "@/components/EntityCard";
import { PhoneLink } from "@/components/PhoneLink";
import { SearchInput } from "@/components/SearchInput";
import { Fab } from "@/components/Fab";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Download, FileSpreadsheet } from "lucide-react";

const exportColumns: ExportColumn<Agent>[] = [
  { header: "Name", value: (a) => a.name },
  { header: "Phone", value: (a) => a.phone },
  { header: "Customer Count", value: (a) => a.customerCount },
  { header: "Coupon Numbers", value: (a) => a.couponNumbers.join(", ") || "-" },
];

const COUPON_PREVIEW_LIMIT = 5;

function CouponNumbers({ couponNumbers }: { couponNumbers: string[] }) {
  if (couponNumbers.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }
  const shown = couponNumbers.slice(0, COUPON_PREVIEW_LIMIT);
  const remaining = couponNumbers.length - shown.length;
  return (
    <span title={couponNumbers.join(", ")}>
      {shown.join(", ")}
      {remaining > 0 && ` +${remaining} more`}
    </span>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState(false);

  function fetchAgents() {
    return getAgents()
      .then(setAgents)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to load agents");
      })
      .finally(() => setLoading(false));
  }

  function reload() {
    setLoading(true);
    fetchAgents();
  }

  useEffect(() => {
    fetchAgents();

  }, []);

  const filteredAgents = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return agents;
    return agents.filter(
      (a) => a.name.toLowerCase().includes(q) || a.phone.toLowerCase().includes(q)
    );
  }, [agents, search]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteAgent(deleteTarget._id);
      toast.success("Agent deleted");
      setDeleteTarget(null);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete agent");
    } finally {
      setDeleting(false);
    }
  }

  function handleExport(format: "excel" | "pdf") {
    if (filteredAgents.length === 0) {
      toast.error("No agents to export");
      return;
    }
    if (format === "excel") {
      exportToExcel("agents", exportColumns, filteredAgents);
    } else {
      exportToPdf("Agents", "agents", exportColumns, filteredAgents);
    }
    toast.success(`Exported ${filteredAgents.length} agents`);
  }

  const columns: DataTableColumn<Agent>[] = [
    { key: "name", header: "Name", cell: (a) => a.name },
    { key: "phone", header: "Phone", cell: (a) => <PhoneLink phone={a.phone} /> },
    {
      key: "count",
      header: "Customer Count",
      cell: (a) => a.customerCount,
    },
    {
      key: "coupons",
      header: "Coupon Numbers",
      cell: (a) => <CouponNumbers couponNumbers={a.couponNumbers} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (a) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/agents/${a._id}/edit`}
            aria-label={`Edit ${a.name}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <Pencil className="size-4" />
          </Link>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Delete ${a.name}`}
            onClick={() => setDeleteTarget(a)}
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Agents</h1>
          <p className="text-muted-foreground">Manage recruiting agents.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => handleExport("excel")}>
            <FileSpreadsheet className="size-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <Download className="size-4" />
            PDF
          </Button>
          <Link
            href="/agents/new"
            className={buttonVariants({ variant: "default", className: "hidden md:inline-flex" })}
          >
            New Agent
          </Link>
        </div>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search agents..."
        className="max-w-sm"
      />

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="hidden md:block">
            <DataTable columns={columns} data={filteredAgents} rowKey={(a) => a._id} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredAgents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No agents found.
              </p>
            ) : (
              filteredAgents.map((agent) => (
                <EntityCard
                  key={agent._id}
                  name={agent.name}
                  subtitle={<PhoneLink phone={agent.phone} withIcon />}
                  onEdit={() => router.push(`/agents/${agent._id}/edit`)}
                  onDelete={() => setDeleteTarget(agent)}
                >
                  <Badge variant="secondary">{agent.customerCount} customers</Badge>
                  <p className="text-sm text-muted-foreground">
                    <CouponNumbers couponNumbers={agent.couponNumbers} />
                  </p>
                </EntityCard>
              ))
            )}
          </div>
        </>
      )}

      <Fab href="/agents/new" label="New agent" />

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete agent?</DialogTitle>
            <DialogDescription>
              This will permanently delete{" "}
              <strong>{deleteTarget?.name}</strong>. Any customers currently
              assigned to this agent will be moved to &quot;Unknown Agent&quot;.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
