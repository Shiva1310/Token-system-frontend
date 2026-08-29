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

interface PaymentStatusGridProps {
  customer: Customer;
  onUpdated?: (customer: Customer) => void;
}

const STATUS_STYLES: Record<Payment["status"], string> = {
  paid: "bg-green-100 text-green-800 border-green-300 hover:bg-green-200",
  pending: "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200",
  exempt: "bg-blue-100 text-blue-800 border-blue-300 cursor-default",
};

export function PaymentStatusGrid({ customer, onUpdated }: PaymentStatusGridProps) {
  const [pendingMonth, setPendingMonth] = useState<number | null>(null);

  async function handleToggle(payment: Payment) {
    if (payment.status === "exempt" || pendingMonth !== null) return;

    const nextStatus = payment.status === "paid" ? "pending" : "paid";
    setPendingMonth(payment.monthIndex);
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
      setPendingMonth(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-1">
      {customer.payments.map((payment) => (
        <button
          key={payment.monthIndex}
          type="button"
          disabled={payment.status === "exempt" || pendingMonth !== null}
          onClick={() => handleToggle(payment)}
          title={`${payment.label}: ₹${payment.amountPaid}/₹${payment.amountDue} (${payment.status})`}
          className={cn(
            "rounded border px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed",
            STATUS_STYLES[payment.status],
            pendingMonth === payment.monthIndex && "opacity-50"
          )}
        >
          {payment.label}
        </button>
      ))}
    </div>
  );
}
