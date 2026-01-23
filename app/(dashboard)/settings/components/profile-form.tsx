"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, uploadAvatar, removeAvatar } from "../actions";
import type { UserProfile } from "../actions";

interface ProfileFormProps {
  profile: UserProfile;
  email: string;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setMessage(null);

    const result = await updateProfile(displayName || null);

    if (result.success) {
      setMessage({ type: "success", text: "Profile updated successfully" });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to update profile" });
    }

    setIsSaving(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);

    const result = await uploadAvatar(formData);

    if (result.success && result.url) {
      setAvatarUrl(result.url + "?t=" + Date.now()); // Cache bust
      setMessage({ type: "success", text: "Avatar uploaded successfully" });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to upload avatar" });
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setTimeout(() => setMessage(null), 3000);
  };

  const handleRemoveAvatar = async () => {
    setIsUploading(true);
    setMessage(null);

    const result = await removeAvatar();

    if (result.success) {
      setAvatarUrl(null);
      setMessage({ type: "success", text: "Avatar removed" });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to remove avatar" });
    }

    setIsUploading(false);
    setTimeout(() => setMessage(null), 3000);
  };

  const initials = displayName
    ? displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : email[0].toUpperCase();

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="flex items-center gap-6">
        <div className="relative group">
          <Avatar className="h-20 w-20">
            <AvatarImage src={avatarUrl || undefined} alt={displayName || email} />
            <AvatarFallback className="text-lg">
              {initials}
            </AvatarFallback>
          </Avatar>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {isUploading ? (
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            ) : (
              <Camera className="h-6 w-6 text-white" />
            )}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
          />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium">Profile Photo</p>
          <p className="text-xs text-muted-foreground">
            Click the avatar to upload a new photo. Max 2MB.
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Upload
            </Button>
            {avatarUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleRemoveAvatar}
                disabled={isUploading}
              >
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">Display Name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter your display name"
          className="max-w-md"
        />
        <p className="text-xs text-muted-foreground">
          This is how your name will appear to others.
        </p>
      </div>

      {/* Email (read-only) */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          value={email}
          disabled
          className="max-w-md bg-muted"
        />
        <p className="text-xs text-muted-foreground">
          Your email cannot be changed.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`text-sm ${
            message.type === "success" ? "text-green-600" : "text-red-600"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Save Button */}
      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </Button>
    </div>
  );
}
