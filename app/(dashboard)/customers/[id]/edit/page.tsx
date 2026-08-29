"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ApiError, getCustomer, setCustomerWin, type Customer } from "@/lib/api";
import { CustomerForm } from "@/components/CustomerForm";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NONE = "none";

export default function EditCustomerPage() {
  const params = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [wonMonth, setWonMonth] = useState<string>(NONE);
  const [savingWin, setSavingWin] = useState(false);

  useEffect(() => {
    getCustomer(params.id)
      .then((found) => {
        setCustomer(found);
        setWonMonth(found.wonMonth != null ? String(found.wonMonth) : NONE);
      })
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to load customer");
      })
      .finally(() => setLoading(false));
  }, [params.id]);

  async function handleSaveWin() {
    if (!customer) return;
    setSavingWin(true);
    try {
      const value = wonMonth === NONE ? null : Number(wonMonth);
      const updated = await setCustomerWin(customer._id, value);
      setCustomer(updated);
      toast.success("Winner status updated");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update winner");
    } finally {
      setSavingWin(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Edit Customer</h1>
        <p className="text-muted-foreground">Update this customer&apos;s details.</p>
      </div>

      {loading ? (
        <Skeleton className="h-96 max-w-2xl" />
      ) : customer ? (
        <>
          <CustomerForm customer={customer} />

          <Card className="max-w-2xl">
            <CardHeader>
              <CardTitle className="text-base">Winner status</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="flex flex-1 flex-col gap-2">
                <Select
                  value={wonMonth}
                  onValueChange={(value) => setWonMonth(value as string)}
                  items={[
                    { value: NONE, label: "Not a winner" },
                    ...customer.payments.map((p) => ({
                      value: String(p.monthIndex),
                      label: p.label,
                    })),
                  ]}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Not a winner</SelectItem>
                    {customer.payments.map((p) => (
                      <SelectItem key={p.monthIndex} value={String(p.monthIndex)}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSaveWin} disabled={savingWin}>
                {savingWin ? "Saving..." : "Mark as winner this month"}
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground">Customer not found.</p>
      )}
    </div>
  );
}
