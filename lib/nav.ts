import type { Role } from "@/lib/api";

export interface NavItem {
  href: string;
  label: string;
  roles: Role[];
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", roles: ["admin"] },
  { href: "/agents", label: "Agents", roles: ["admin", "staff"] },
  { href: "/customers", label: "Customers", roles: ["admin", "staff"] },
  { href: "/settings", label: "Settings", roles: ["admin"] },
];

export function navItemsForRole(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
