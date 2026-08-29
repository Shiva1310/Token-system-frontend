"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Pencil, Trash2 } from "lucide-react";
import {
  ApiError,
  deleteCustomer,
  getCustomers,
  type Customer,
} from "@/lib/api";
import { DataTable, type DataTableColumn } from "@/components/DataTable";
import { PaymentStatusGrid } from "@/components/PaymentStatusGrid";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const PAGE_SIZE = 20;

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handle = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handle);
  }, [searchInput]);

  function fetchCustomers() {
    return getCustomers({ page, limit: PAGE_SIZE, search })
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
  }, [page, search]);

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

  const columns: DataTableColumn<Customer>[] = [
    { key: "name", header: "Name", cell: (c) => c.name },
    { key: "phone", header: "Phone", cell: (c) => c.phone },
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
        <Link href="/customers/new" className={buttonVariants({ variant: "default" })}>
          New Customer
        </Link>
      </div>

      <Input
        placeholder="Search by name, phone, or coupon number..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
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
                    <p className="text-muted-foreground">{customer.phone}</p>
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
