"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { setUserRole, isAdmin } from "@/lib/auth/roles";
import type { UserRole } from "@/lib/types";

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole | null;
  created_at: string;
  last_sign_in_at: string | null;
}

export async function getUsers(): Promise<{
  users: UserWithRole[];
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { users: [], error: "Not authenticated" };
  }

  const adminCheck = await isAdmin(user.id);
  if (!adminCheck) {
    return { users: [], error: "Not authorized" };
  }

  const serviceClient = await createServiceClient();
  const {
    data: { users },
    error,
  } = await serviceClient.auth.admin.listUsers();

  if (error) {
    console.error("Error fetching users:", error);
    return { users: [], error: error.message };
  }

  // Get roles for all users
  const { data: roles } = await serviceClient
    .from("user_roles")
    .select("user_id, role");

  const roleMap = new Map(roles?.map((r) => [r.user_id, r.role as UserRole]));

  const usersWithRoles: UserWithRole[] = users.map((u) => ({
    id: u.id,
    email: u.email || "",
    role: roleMap.get(u.id) || null,
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at || null,
  }));

  return { users: usersWithRoles };
}

export async function inviteUser(
  email: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminCheck = await isAdmin(user.id);
  if (!adminCheck) {
    return { success: false, error: "Not authorized" };
  }

  const serviceClient = await createServiceClient();

  // Use site URL for redirect
  const redirectTo = process.env.NEXT_PUBLIC_SITE_URL
    ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    : undefined;

  const { data, error } = await serviceClient.auth.admin.inviteUserByEmail(
    email,
    {
      redirectTo,
    }
  );

  if (error) {
    console.error("Error inviting user:", error);
    return { success: false, error: error.message };
  }

  // Pre-assign the role
  if (data.user) {
    const roleResult = await setUserRole(data.user.id, role);
    if (roleResult.error) {
      console.error("Error setting role for invited user:", roleResult.error);
    }
  }

  revalidatePath("/settings/users");
  return { success: true };
}

export async function updateUserRole(
  userId: string,
  role: UserRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminCheck = await isAdmin(user.id);
  if (!adminCheck) {
    return { success: false, error: "Not authorized" };
  }

  // Prevent self-demotion
  if (userId === user.id && role !== "admin") {
    return { success: false, error: "Cannot demote yourself" };
  }

  const result = await setUserRole(userId, role);
  if (result.error) {
    return { success: false, error: result.error };
  }

  revalidatePath("/settings/users");
  return { success: true };
}

export async function removeUser(
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const adminCheck = await isAdmin(user.id);
  if (!adminCheck) {
    return { success: false, error: "Not authorized" };
  }

  // Prevent self-deletion
  if (userId === user.id) {
    return { success: false, error: "Cannot delete yourself" };
  }

  const serviceClient = await createServiceClient();

  // Delete user role first
  await serviceClient.from("user_roles").delete().eq("user_id", userId);

  // Delete the user from auth
  const { error } = await serviceClient.auth.admin.deleteUser(userId);

  if (error) {
    console.error("Error removing user:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/users");
  return { success: true };
}
