import type { ReactNode } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
import { getInitials, avatarColor } from "@/lib/avatar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface EntityCardProps {
  name: string;
  subtitle?: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  readOnly?: boolean;
  children?: ReactNode;
}

export function EntityCard({
  name,
  subtitle,
  onEdit,
  onDelete,
  readOnly = false,
  children,
}: EntityCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start gap-3 p-4">
        <Avatar size="lg" className="mt-0.5">
          <AvatarFallback className={`${avatarColor(name)} text-white`}>
            {getInitials(name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex items-start justify-between gap-2">
            <p className="font-medium leading-tight">{name}</p>
            {!readOnly && (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="-mt-1 -mr-2 size-8"
                      aria-label={`Actions for ${name}`}
                    />
                  }
                >
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={onEdit}>
                    <Pencil className="size-4" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem variant="destructive" onClick={onDelete}>
                    <Trash2 className="size-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {subtitle && <div className="text-sm text-muted-foreground">{subtitle}</div>}
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
