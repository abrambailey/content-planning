import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth/roles";
import { getUsers } from "./actions";
import { UsersPageClient } from "./components/users-page-client";

export default async function UsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const adminCheck = await isAdmin(user.id);
  if (!adminCheck) {
    redirect("/");
  }

  const { users, error } = await getUsers();

  if (error) {
    return (
      <div className="p-6">
        <p className="text-destructive">Error loading users: {error}</p>
      </div>
    );
  }

  return <UsersPageClient users={users} currentUserId={user.id} />;
}
