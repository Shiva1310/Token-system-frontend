"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  ApiError,
  updateCustomerPayment,
  type Customer,
  type Payment,
} from "@/lib/api";

const STATUS_STYLES: Record<Payment["status"], string> = {
  paid: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
  pending: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
  exempt: "bg-blue-100 text-blue-800 border-blue-300 cursor-default",
};

const STATUS_LABELS: Record<Payment["status"], string> = {
  paid: "Paid",
  pending: "Pending",
  exempt: "Exempt",
};

interface MonthPaymentCellProps {
  customer: Customer;
  monthIndex: number;
  onUpdated?: (customer: Customer) => void;
  showLabel?: boolean;
}

export function MonthPaymentCell({
  customer,
  monthIndex,
  onUpdated,
  showLabel = false,
}: MonthPaymentCellProps) {
  const [pending, setPending] = useState(false);
  const payment = customer.payments.find((p) => p.monthIndex === monthIndex);

  if (!payment) return null;

  async function handleToggle() {
    if (!payment || payment.status === "exempt" || pending) return;

    const nextStatus = payment.status === "paid" ? "pending" : "paid";
    setPending(true);
    try {
      const updated = await updateCustomerPayment(customer._id, payment.monthIndex, {
        status: nextStatus,
        amountPaid: nextStatus === "paid" ? payment.amountDue : 0,
        paidDate: nextStatus === "paid" ? new Date().toISOString() : undefined,
      });
      onUpdated?.(updated);
      toast.success(`${payment.label} marked as ${nextStatus}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to update payment");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      disabled={payment.status === "exempt" || pending}
      onClick={handleToggle}
      title={`${payment.label}: ₹${payment.amountPaid}/₹${payment.amountDue} (${payment.status})`}
      className={cn(
        "rounded border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed",
        STATUS_STYLES[payment.status],
        pending && "opacity-50"
      )}
    >
      {showLabel ? payment.label : STATUS_LABELS[payment.status]}
    </button>
  );
}

interface PaymentStatusGridProps {
  customer: Customer;
  onUpdated?: (customer: Customer) => void;
}

export function PaymentStatusGrid({ customer, onUpdated }: PaymentStatusGridProps) {
  return (
    <div className="flex flex-wrap gap-1">
      {customer.payments.map((payment) => (
        <MonthPaymentCell
          key={payment.monthIndex}
          customer={customer}
          monthIndex={payment.monthIndex}
          onUpdated={onUpdated}
          showLabel
        />
      ))}
    </div>
  );
}
