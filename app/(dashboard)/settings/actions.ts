"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
}

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("user_profiles")
    .select("id, display_name, avatar_url")
    .eq("id", user.id)
    .single();

  if (data) {
    return data;
  }

  // Return default profile if none exists
  return {
    id: user.id,
    display_name: null,
    avatar_url: null,
  };
}

export async function updateProfile(
  displayName: string | null
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Upsert the profile
  const { error } = await supabase.from("user_profiles").upsert(
    {
      id: user.id,
      display_name: displayName,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}

export async function uploadAvatar(
  formData: FormData
): Promise<{ success: boolean; error?: string; url?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const file = formData.get("file") as File;
  if (!file) {
    return { success: false, error: "No file provided" };
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "File must be an image" };
  }

  // Validate file size (max 2MB)
  if (file.size > 2 * 1024 * 1024) {
    return { success: false, error: "File must be less than 2MB" };
  }

  const fileExt = file.name.split(".").pop();
  const fileName = `${user.id}/avatar.${fileExt}`;

  // Delete existing avatar if any
  await supabase.storage.from("avatars").remove([`${user.id}/avatar.png`, `${user.id}/avatar.jpg`, `${user.id}/avatar.jpeg`, `${user.id}/avatar.webp`]);

  // Upload new avatar
  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(fileName, file, { upsert: true });

  if (uploadError) {
    console.error("Error uploading avatar:", uploadError);
    return { success: false, error: uploadError.message };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(fileName);

  // Update profile with avatar URL
  const { error: updateError } = await supabase.from("user_profiles").upsert(
    {
      id: user.id,
      avatar_url: publicUrl,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (updateError) {
    console.error("Error updating profile with avatar:", updateError);
    return { success: false, error: updateError.message };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true, url: publicUrl };
}

export async function removeAvatar(): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Remove all possible avatar files
  await supabase.storage.from("avatars").remove([
    `${user.id}/avatar.png`,
    `${user.id}/avatar.jpg`,
    `${user.id}/avatar.jpeg`,
    `${user.id}/avatar.webp`,
  ]);

  // Update profile to remove avatar URL
  const { error } = await supabase.from("user_profiles").upsert(
    {
      id: user.id,
      avatar_url: null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "id" }
  );

  if (error) {
    console.error("Error removing avatar from profile:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/", "layout");
  return { success: true };
}
