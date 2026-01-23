"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { UserWithRole } from "../actions";

interface ColumnActions {
  onEditRole: (user: UserWithRole) => void;
  onDelete: (user: UserWithRole) => void;
  currentUserId: string;
}

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  editor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  author: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function createColumns(actions: ColumnActions): ColumnDef<UserWithRole>[] {
  return [
    {
      accessorKey: "email",
      header: "User",
      cell: ({ row }) => {
        const user = row.original;
        const initial = user.email?.[0]?.toUpperCase() || "?";
        const isCurrentUser = user.id === actions.currentUserId;
        return (
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">{initial}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
              <span className="font-medium">
                {user.email}
                {isCurrentUser && (
                  <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                )}
              </span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ row }) => {
        const role = row.original.role;
        if (!role) {
          return <span className="text-muted-foreground">No role</span>;
        }
        return (
          <Badge variant="secondary" className={roleColors[role] || ""}>
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </Badge>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Joined",
      cell: ({ row }) => {
        const date = row.original.created_at;
        if (!date) return <span className="text-muted-foreground">-</span>;
        return format(new Date(date), "MMM d, yyyy");
      },
    },
    {
      accessorKey: "last_sign_in_at",
      header: "Last Active",
      cell: ({ row }) => {
        const date = row.original.last_sign_in_at;
        if (!date) return <span className="text-muted-foreground">Never</span>;
        return format(new Date(date), "MMM d, yyyy");
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        const user = row.original;
        const isCurrentUser = user.id === actions.currentUserId;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => actions.onEditRole(user)}>
                <Pencil className="mr-2 h-4 w-4" />
                Change role
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => actions.onDelete(user)}
                className="text-destructive"
                disabled={isCurrentUser}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove user
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];
}
