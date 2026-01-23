"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { UserRole } from "@/lib/types";
import type { UserWithRole } from "../actions";

interface EditRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserWithRole | null;
  currentUserId: string;
  onSubmit: (userId: string, role: UserRole) => Promise<void>;
}

export function EditRoleDialog({
  open,
  onOpenChange,
  user,
  currentUserId,
  onSubmit,
}: EditRoleDialogProps) {
  const [role, setRole] = useState<UserRole>("author");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isCurrentUser = user?.id === currentUserId;

  useEffect(() => {
    if (user?.role) {
      setRole(user.role);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      await onSubmit(user.id, role);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Role</DialogTitle>
            <DialogDescription>
              Update the role for {user.email}
              {isCurrentUser && " (yourself)"}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={role}
                onValueChange={(value) => setRole(value as UserRole)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="author" description="Can create and edit content">
                    Author
                  </SelectItem>
                  <SelectItem value="editor" description="Can manage all content">
                    Editor
                  </SelectItem>
                  <SelectItem
                    value="admin"
                    description="Full access including user management"
                    disabled={isCurrentUser && user.role === "admin"}
                  >
                    Admin
                  </SelectItem>
                </SelectContent>
              </Select>
              {isCurrentUser && (
                <p className="text-xs text-muted-foreground">
                  Note: You cannot demote yourself from admin.
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              type="submit"
              disabled={isSubmitting || role === user.role}
            >
              {isSubmitting ? "Saving..." : "Save changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
