"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { ApiError, deleteAgent, getAgents, type Agent } from "@/lib/api";
import { exportToExcel, exportToPdf, type ExportColumn } from "@/lib/export";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
];

function PhoneLink({ phone }: { phone: string }) {
  return (
    <a href={`tel:${phone}`} className="text-primary hover:underline">
      {phone}
    </a>
  );
}

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
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
    if (agents.length === 0) {
      toast.error("No agents to export");
      return;
    }
    if (format === "excel") {
      exportToExcel("agents", exportColumns, agents);
    } else {
      exportToPdf("Agents", "agents", exportColumns, agents);
    }
    toast.success(`Exported ${agents.length} agents`);
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
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
          <Link href="/agents/new" className={buttonVariants({ variant: "default" })}>
            New Agent
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : (
        <>
          <div className="hidden sm:block">
            <DataTable columns={columns} data={agents} rowKey={(a) => a._id} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {agents.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No agents found.
              </p>
            ) : (
              agents.map((agent) => (
                <Card key={agent._id}>
                  <CardHeader>
                    <CardTitle className="text-base">{agent.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <PhoneLink phone={agent.phone} />
                    </p>
                    <p>{agent.customerCount} customers</p>
                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/agents/${agent._id}/edit`}
                        className={buttonVariants({
                          variant: "outline",
                          size: "sm",
                          className: "flex-1",
                        })}
                      >
                        Edit
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => setDeleteTarget(agent)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

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
