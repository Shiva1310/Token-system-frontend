import { Ticket } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ size = "default" }: { size?: "default" | "lg" }) {
  const badgeSize = size === "lg" ? "size-12" : "size-8";
  const iconSize = size === "lg" ? "size-6" : "size-4";
  const textSize = size === "lg" ? "text-2xl" : "text-base";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
          badgeSize
        )}
      >
        <Ticket className={iconSize} />
      </div>
      <span className={cn("font-semibold tracking-tight whitespace-nowrap", textSize)}>
        NAM Coupons
      </span>
    </div>
  );
}
