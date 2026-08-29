"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2, Download, FileSpreadsheet } from "lucide-react";
import {
  ApiError,
  deleteCustomer,
  getAgents,
  getCustomers,
  type Agent,
  type Customer,
  type PaymentStatus,
} from "@/lib/api";
import { exportToExcel, exportToPdf, type ExportColumn } from "@/lib/export";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { PaymentStatusGrid } from "@/components/PaymentStatusGrid";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const PAGE_SIZE = 20;
const ALL = "all";

const MONTH_OPTIONS = [
  { value: "1", label: "Aug 2026" },
  { value: "2", label: "Sep 2026" },
  { value: "3", label: "Oct 2026" },
  { value: "4", label: "Nov 2026" },
  { value: "5", label: "Dec 2026" },
  { value: "6", label: "Jan 2027" },
];

const STATUS_OPTIONS: { value: PaymentStatus; label: string }[] = [
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "exempt", label: "Exempt (winner)" },
];

function PhoneLink({ phone }: { phone: string }) {
  return (
    <a href={`tel:${phone}`} className="text-primary hover:underline">
      {phone}
    </a>
  );
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [agentFilter, setAgentFilter] = useState(ALL);
  const [monthFilter, setMonthFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState<string>(ALL);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  useEffect(() => {
    getAgents()
      .then(setAgents)
      .catch(() => {
        // Filter dropdown just stays empty; the main list still loads fine.
      });
  }, []);

  function activeFilters() {
    return {
      search,
      agentId: agentFilter === ALL ? undefined : agentFilter,
      monthIndex: monthFilter === ALL ? undefined : Number(monthFilter),
      status: statusFilter === ALL ? undefined : (statusFilter as PaymentStatus),
    };
  }

  function fetchCustomers() {
    return getCustomers({ page, limit: PAGE_SIZE, ...activeFilters() })
      .then((res) => {
        setCustomers(res.data);
        setTotalPages(res.totalPages || 1);
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to load customers");
      })
      .finally(() => setLoading(false));
  }

  function reload() {
    setLoading(true);
    fetchCustomers();
  }

  useEffect(() => {
    fetchCustomers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, agentFilter, monthFilter, statusFilter]);

  function handleMonthChange(value: string | null) {
    const next = value ?? ALL;
    setMonthFilter(next);
    if (next === ALL) setStatusFilter(ALL);
    setPage(1);
  }

  function handlePaymentUpdated(updated: Customer) {
    setCustomers((prev) =>
      prev.map((c) => (c._id === updated._id ? updated : c))
    );
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCustomer(deleteTarget._id);
      toast.success("Customer deleted");
      setDeleteTarget(null);
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to delete customer");
    } finally {
      setDeleting(false);
    }
  }

  const exportColumns: ExportColumn<Customer>[] = [
    { header: "Name", value: (c) => c.name },
    { header: "Phone", value: (c) => c.phone },
    { header: "Address", value: (c) => c.address },
    { header: "Coupon Number", value: (c) => c.couponNumber },
    { header: "Agent", value: (c) => c.agentId?.name ?? "Unknown Agent" },
    ...MONTH_OPTIONS.map((month) => ({
      header: month.label,
      value: (c: Customer) => {
        const payment = c.payments.find((p) => p.monthIndex === Number(month.value));
        return payment ? payment.status : "-";
      },
    })),
  ];

  async function handleExport(format: "excel" | "pdf") {
    setExporting(true);
    try {
      const res = await getCustomers({ page: 1, limit: 100000, ...activeFilters() });
      if (res.data.length === 0) {
        toast.error("No customers match the current filters");
        return;
      }
      if (format === "excel") {
        exportToExcel("customers", exportColumns, res.data);
      } else {
        exportToPdf("Customers", "customers", exportColumns, res.data);
      }
      toast.success(`Exported ${res.data.length} customers`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Export failed");
    } finally {
      setExporting(false);
    }
  }

  const columns: DataTableColumn<Customer>[] = [
    { key: "name", header: "Name", cell: (c) => c.name },
    { key: "phone", header: "Phone", cell: (c) => <PhoneLink phone={c.phone} /> },
    { key: "address", header: "Address", cell: (c) => c.address },
    {
      key: "agent",
      header: "Agent",
      cell: (c) => c.agentId?.name ?? "Unknown Agent",
    },
    {
      key: "payments",
      header: "Payments",
      cell: (c) => (
        <PaymentStatusGrid customer={c} onUpdated={handlePaymentUpdated} />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      cell: (c) => (
        <div className="flex justify-end gap-2">
          <Link
            href={`/customers/${c._id}/edit`}
            aria-label={`Edit ${c.name}`}
            className={buttonVariants({ variant: "outline", size: "icon" })}
          >
            <Pencil className="size-4" />
          </Link>
          <Button
            variant="outline"
            size="icon"
            aria-label={`Delete ${c.name}`}
            onClick={() => setDeleteTarget(c)}
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
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-muted-foreground">Manage members and their payments.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={exporting}
          >
            <FileSpreadsheet className="size-4" />
            Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={exporting}
          >
            <Download className="size-4" />
            PDF
          </Button>
          <Link href="/customers/new" className={buttonVariants({ variant: "default" })}>
            New Customer
          </Link>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Input
          placeholder="Search by name, phone, or coupon number..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="max-w-sm"
        />

        <Select
          value={agentFilter}
          onValueChange={(value) => {
            setAgentFilter(value as string);
            setPage(1);
          }}
          items={[
            { value: ALL, label: "All agents" },
            ...agents.map((a) => ({ value: a._id, label: a.name })),
          ]}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All agents" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All agents</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a._id} value={a._id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={monthFilter}
          onValueChange={handleMonthChange}
          items={[{ value: ALL, label: "All months" }, ...MONTH_OPTIONS]}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All months" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All months</SelectItem>
            {MONTH_OPTIONS.map((m) => (
              <SelectItem key={m.value} value={m.value}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value as string);
            setPage(1);
          }}
          disabled={monthFilter === ALL}
          items={[{ value: ALL, label: "Any status" }, ...STATUS_OPTIONS]}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Any status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Any status</SelectItem>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
            <DataTable columns={columns} data={customers} rowKey={(c) => c._id} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {customers.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No customers found.
              </p>
            ) : (
              customers.map((customer) => (
                <Card key={customer._id}>
                  <CardHeader>
                    <CardTitle className="text-base">{customer.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p className="text-muted-foreground">
                      <PhoneLink phone={customer.phone} />
                    </p>
                    <p className="text-muted-foreground">{customer.address}</p>
                    <p>Agent: {customer.agentId?.name ?? "Unknown Agent"}</p>
                    <PaymentStatusGrid
                      customer={customer}
                      onUpdated={handlePaymentUpdated}
                    />
                    <div className="flex gap-2 pt-2">
                      <Link
                        href={`/customers/${customer._id}/edit`}
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
                        onClick={() => setDeleteTarget(customer)}
                      >
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

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

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete customer?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{deleteTarget?.name}</strong> and
              their payment history. This action cannot be undone.
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
