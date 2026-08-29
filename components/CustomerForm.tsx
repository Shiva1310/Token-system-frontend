"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ApiError,
  checkCoupon,
  createCustomer,
  getAgents,
  updateCustomer,
  type Agent,
  type Customer,
} from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomerFormProps {
  customer?: Customer;
}

type CouponStatus = "idle" | "checking" | "available" | "taken" | "error";

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [name, setName] = useState(customer?.name ?? "");
  const [phone, setPhone] = useState(customer?.phone ?? "");
  const [address, setAddress] = useState(customer?.address ?? "");
  const [agentId, setAgentId] = useState(customer?.agentId?._id ?? "");
  const [couponNumber, setCouponNumber] = useState(customer?.couponNumber ?? "");
  const [couponStatus, setCouponStatus] = useState<CouponStatus>("idle");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getAgents()
      .then(setAgents)
      .catch((err) => {
        toast.error(err instanceof ApiError ? err.message : "Failed to load agents");
      })
      .finally(() => setAgentsLoading(false));
  }, []);

  async function handleCouponBlur() {
    const trimmed = couponNumber.trim();
    if (!trimmed) {
      setCouponStatus("idle");
      return;
    }
    if (customer && trimmed === customer.couponNumber) {
      setCouponStatus("idle");
      return;
    }
    setCouponStatus("checking");
    try {
      const res = await checkCoupon(trimmed, customer?._id);
      setCouponStatus(res.available ? "available" : "taken");
    } catch {
      setCouponStatus("error");
    }
  }

  const couponBlocking = couponStatus === "checking" || couponStatus === "taken";

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!agentId) {
      toast.error("Please select an agent");
      return;
    }
    if (couponBlocking) return;

    setSubmitting(true);
    try {
      const payload = {
        name,
        phone,
        address,
        couponNumber: couponNumber.trim(),
        agentId,
      };
      if (customer) {
        await updateCustomer(customer._id, payload);
        toast.success("Customer updated");
      } else {
        await createCustomer(payload);
        toast.success("Customer created");
      }
      router.push("/customers");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save customer");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{customer ? "Edit Customer" : "New Customer"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="agent">Agent</Label>
            <Select
              value={agentId}
              onValueChange={(value) => setAgentId(value as string)}
              items={agents.map((agent) => ({ value: agent._id, label: agent.name }))}
            >
              <SelectTrigger id="agent" className="w-full">
                <SelectValue
                  placeholder={agentsLoading ? "Loading agents..." : "Select an agent"}
                />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent._id} value={agent._id}>
                    {agent.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="coupon">Coupon Number</Label>
            <Input
              id="coupon"
              value={couponNumber}
              onChange={(e) => {
                setCouponNumber(e.target.value);
                setCouponStatus("idle");
              }}
              onBlur={handleCouponBlur}
              required
            />
            {couponStatus === "checking" && (
              <p className="text-xs text-muted-foreground">Checking availability...</p>
            )}
            {couponStatus === "available" && (
              <p className="text-xs text-green-600">Coupon number is available.</p>
            )}
            {couponStatus === "taken" && (
              <p className="text-xs text-destructive">
                Coupon number is already in use.
              </p>
            )}
            {couponStatus === "error" && (
              <p className="text-xs text-destructive">
                Could not verify coupon number.
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="phone">Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-2 sm:col-span-2">
            <Label htmlFor="address">Address <span className="text-muted-foreground font-normal">(optional)</span></Label>
            <Input
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </div>
          <div className="flex gap-2 sm:col-span-2">
            <Button type="submit" disabled={submitting || couponBlocking}>
              {submitting ? "Saving..." : customer ? "Save changes" : "Create customer"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/customers")}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
