import { LayoutGrid, Users, User, Settings } from "lucide-react";
import type { Role } from "@/lib/api";

export interface NavItem {
  href: string;
  label: string;
  roles: Role[];
  icon: typeof LayoutGrid;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin"], icon: LayoutGrid },
  { href: "/agents", label: "Agents", roles: ["admin", "staff"], icon: Users },
  { href: "/customers", label: "Customers", roles: ["admin", "staff"], icon: User },
  { href: "/settings", label: "Settings", roles: ["admin"], icon: Settings },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
