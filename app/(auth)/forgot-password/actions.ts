"use server";

import { createClient } from "@/lib/supabase/server";
import { headers } from "next/headers";

export async function forgotPassword(email: string) {
  const supabase = await createClient();
  const headersList = await headers();
  const origin = headersList.get("origin") || "http://localhost:3005";

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/recovery`,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}
