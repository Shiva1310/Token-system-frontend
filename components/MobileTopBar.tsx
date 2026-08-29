"use client";

import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getInitials, avatarColor } from "@/lib/avatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileTopBar() {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <div className="flex h-14 items-center justify-between border-b bg-card px-4 md:hidden">
      <span className="font-semibold">Temple Lottery</span>
      <DropdownMenu>
        <DropdownMenuTrigger render={<button aria-label="Account menu" />}>
          <Avatar size="sm">
            <AvatarFallback className={`${avatarColor(user.name)} text-white`}>
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <div className="px-2 py-1.5 text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-muted-foreground capitalize">{user.role}</p>
          </div>
          <DropdownMenuItem onClick={logout} variant="destructive">
            <LogOut className="size-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
