"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UsersDataTable } from "./users-data-table";
import { InviteUserDialog } from "./invite-user-dialog";
import { EditRoleDialog } from "./edit-role-dialog";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { inviteUser, updateUserRole, removeUser } from "../actions";
import type { UserWithRole } from "../actions";
import type { UserRole } from "@/lib/types";

interface UsersPageClientProps {
  users: UserWithRole[];
  currentUserId: string;
}

export function UsersPageClient({ users, currentUserId }: UsersPageClientProps) {
  const router = useRouter();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserWithRole | null>(null);

  const handleInvite = async (email: string, role: UserRole) => {
    const result = await inviteUser(email, role);
    if (!result.success) {
      alert(result.error || "Failed to invite user");
      throw new Error(result.error);
    }
    router.refresh();
  };

  const handleUpdateRole = async (userId: string, role: UserRole) => {
    const result = await updateUserRole(userId, role);
    if (!result.success) {
      alert(result.error || "Failed to update role");
      throw new Error(result.error);
    }
    router.refresh();
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    const result = await removeUser(selectedUser.id);
    if (!result.success) {
      alert(result.error || "Failed to remove user");
      return;
    }
    setDeleteDialogOpen(false);
    setSelectedUser(null);
    router.refresh();
  };

  const openEditRoleDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setEditRoleDialogOpen(true);
  };

  const openDeleteDialog = (user: UserWithRole) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Users</h2>
          <p className="text-muted-foreground">
            Manage team members and their roles.
          </p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Invite user
        </Button>
      </div>

      <UsersDataTable
        data={users}
        onEditRole={openEditRoleDialog}
        onDelete={openDeleteDialog}
        currentUserId={currentUserId}
      />

      <InviteUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        onSubmit={handleInvite}
      />

      <EditRoleDialog
        open={editRoleDialogOpen}
        onOpenChange={setEditRoleDialogOpen}
        user={selectedUser}
        currentUserId={currentUserId}
        onSubmit={handleUpdateRole}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Remove user"
        description={`Are you sure you want to remove ${selectedUser?.email}? This action cannot be undone.`}
        confirmLabel="Remove"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
