"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiError, deleteAgent, getAgentsPaginated, type Agent } from "@/lib/api";
import { exportToExcel, exportToPdf, type ExportColumn } from "@/lib/export";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { EntityCard } from "@/components/EntityCard";
import { PhoneLink } from "@/components/PhoneLink";
import { SearchInput } from "@/components/SearchInput";
import { Fab } from "@/components/Fab";
import { ImportAgentsDialog } from "@/components/ImportAgentsDialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Download, FileSpreadsheet, Plus, Ticket } from "lucide-react";

const PAGE_SIZE = 20;

const exportColumns: ExportColumn<Agent>[] = [
  { header: "Name", value: (a) => a.name },
  { header: "Phone", value: (a) => a.phone },
  { header: "Customer Count", value: (a) => a.customerCount },
  { header: "Coupon Numbers", value: (a) => a.couponNumbers.join(", ") || "-" },
];

const COUPON_PREVIEW_LIMIT = 4;

function CouponBadge({ coupon }: { coupon: string }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">
      {coupon}
    </span>
  );
}

function CouponNumbers({
  agentName,
  couponNumbers,
}: {
  agentName: string;
  couponNumbers: string[];
}) {
  const [open, setOpen] = useState(false);

  if (couponNumbers.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  const shown = couponNumbers.slice(0, COUPON_PREVIEW_LIMIT);
  const remaining = couponNumbers.length - shown.length;

  return (
    <>
      <div className="flex flex-wrap items-center gap-1.5">
        {shown.map((coupon) => (
          <CouponBadge key={coupon} coupon={coupon} />
        ))}
        {remaining > 0 && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex items-center rounded-full border border-dashed px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            +{remaining} more
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="size-4.5 text-muted-foreground" />
              {agentName}
            </DialogTitle>
            <DialogDescription>
              {couponNumbers.length} coupon{couponNumbers.length === 1 ? "" : "s"} assigned to
              this agent.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto rounded-lg border bg-muted/20 p-3">
            <div className="flex flex-wrap gap-1.5">
              {couponNumbers.map((coupon) => (
                <CouponBadge key={coupon} coupon={coupon} />
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Agent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  function fetchAgents() {
    return getAgentsPaginated({ page, limit: PAGE_SIZE, search })
      .then((res) => {
        setAgents(res.data);
        setTotalPages(res.totalPages || 1);
        setTotal(res.total || 0);
      })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search]);

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

  async function handleExport(format: "excel" | "pdf") {
    setExporting(true);
    try {
      const res = await getAgentsPaginated({ page: 1, limit: 100000, search });
      if (res.data.length === 0) {
        toast.error("No agents to export");
        return;
      }
      if (format === "excel") {
        exportToExcel("agents", exportColumns, res.data);
      } else {
        exportToPdf("Agents", "agents", exportColumns, res.data);
      }
      toast.success(`Exported ${res.data.length} agents`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
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
      cell: (a) => <CouponNumbers agentName={a.name} couponNumbers={a.couponNumbers} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (a) =>
        a.isSystem ? (
          <div className="flex justify-end">
            <Badge variant="secondary">System</Badge>
          </div>
        ) : (
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
          <ImportAgentsDialog onImported={reload} />
          <Button variant="outline" onClick={() => handleExport("excel")} disabled={exporting}>
            <FileSpreadsheet className="size-4" />
            Excel
          </Button>
          <Button variant="outline" onClick={() => handleExport("pdf")} disabled={exporting}>
            <Download className="size-4" />
            PDF
          </Button>
          <Link
            href="/agents/new"
            className={cn(buttonVariants({ variant: "default" }), "hidden gap-1.5 md:inline-flex")}
          >
            <Plus className="size-4" />
            New Agent
          </Link>
        </div>
      </div>

      <SearchInput
        value={searchInput}
        onChange={setSearchInput}
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
            <DataTable columns={columns} data={agents} rowKey={(a) => a._id} />
          </div>
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {agents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No agents found.
              </p>
            ) : (
              agents.map((agent) => (
                <EntityCard
                  key={agent._id}
                  name={agent.name}
                  subtitle={<PhoneLink phone={agent.phone} withIcon />}
                  onEdit={() => router.push(`/agents/${agent._id}/edit`)}
                  onDelete={() => setDeleteTarget(agent)}
                  readOnly={agent.isSystem}
                >
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{agent.customerCount} customers</Badge>
                    {agent.isSystem && <Badge variant="secondary">System</Badge>}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <CouponNumbers agentName={agent.name} couponNumbers={agent.couponNumbers} />
                  </div>
                </EntityCard>
              ))
            )}
          </div>
          {agents.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Showing {(page - 1) * PAGE_SIZE + 1}-
              {(page - 1) * PAGE_SIZE + agents.length} of {total} agents
            </p>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </Button>
            </div>
          )}
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
