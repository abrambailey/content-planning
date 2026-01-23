"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { NotificationPreferences, EventPreferences } from "@/lib/notifications/types";

export async function getNotificationPreferences(): Promise<NotificationPreferences | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("notification_preferences")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error) {
    // If no preferences exist, create default ones
    if (error.code === "PGRST116") {
      const { data: newPrefs, error: insertError } = await supabase
        .from("notification_preferences")
        .insert({ user_id: user.id })
        .select()
        .single();

      if (insertError) {
        console.error("Error creating default preferences:", insertError);
        return null;
      }

      return newPrefs;
    }

    console.error("Error fetching notification preferences:", error);
    return null;
  }

  return data;
}

export async function updateNotificationPreferences(
  updates: Partial<{
    notifications_enabled: boolean;
    browser_enabled: boolean;
    email_enabled: boolean;
    event_preferences: EventPreferences;
  }>
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Upsert to handle case where preferences don't exist
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        ...updates,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Error updating notification preferences:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings/notifications");
  revalidatePath("/");
  return { success: true };
}

export async function toggleGlobalMute(): Promise<{
  success: boolean;
  isMuted: boolean;
  error?: string;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, isMuted: false, error: "Not authenticated" };
  }

  // Get current state
  const { data: current } = await supabase
    .from("notification_preferences")
    .select("notifications_enabled")
    .eq("user_id", user.id)
    .single();

  const newState = !(current?.notifications_enabled ?? true);

  // Update or insert
  const { error } = await supabase
    .from("notification_preferences")
    .upsert(
      {
        user_id: user.id,
        notifications_enabled: newState,
      },
      { onConflict: "user_id" }
    );

  if (error) {
    console.error("Error toggling global mute:", error);
    return { success: false, isMuted: !newState, error: error.message };
  }

  revalidatePath("/settings/notifications");
  revalidatePath("/");
  return { success: true, isMuted: !newState };
}
