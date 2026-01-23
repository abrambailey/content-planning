"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import type { PushSubscriptionInput } from "./types";

export async function savePushSubscription(
  subscription: PushSubscriptionInput
): Promise<{ success: boolean; error?: string }> {
  // Use regular client for auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  console.log("[Push] savePushSubscription called, user:", user?.id);

  if (!user) {
    console.log("[Push] No user found, returning not authenticated");
    return { success: false, error: "Not authenticated" };
  }

  console.log("[Push] Attempting upsert for endpoint:", subscription.endpoint.substring(0, 50) + "...");

  // Use service role client for database operation to bypass RLS issues
  const serviceClient = await createServiceClient();
  const { data, error } = await serviceClient.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh_key: subscription.p256dh_key,
      auth_key: subscription.auth_key,
    },
    {
      onConflict: "user_id,endpoint",
    }
  ).select();

  console.log("[Push] Upsert result - data:", data, "error:", error);

  if (error) {
    console.error("[Push] Error saving push subscription:", error);
    return { success: false, error: error.message };
  }

  // Verify the subscription was saved
  const { count } = await serviceClient
    .from("push_subscriptions")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  console.log("[Push] Subscription count for user after save:", count);

  return { success: true };
}

export async function removePushSubscription(
  endpoint: string
): Promise<{ success: boolean; error?: string }> {
  // Use regular client for auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Use service role client for database operation
  const serviceClient = await createServiceClient();
  const { error } = await serviceClient
    .from("push_subscriptions")
    .delete()
    .eq("user_id", user.id)
    .eq("endpoint", endpoint);

  if (error) {
    console.error("Error removing push subscription:", error);
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function getVapidPublicKey(): Promise<string | null> {
  return process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null;
}
