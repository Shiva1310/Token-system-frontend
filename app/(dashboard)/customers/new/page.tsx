import { CustomerForm } from "@/components/CustomerForm";

export default function NewCustomerPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New Customer</h1>
        <p className="text-muted-foreground">Register a new coupon-lottery member.</p>
      </div>
      <CustomerForm />
    </div>
  );
}
