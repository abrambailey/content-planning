"use client";

import { useState, useRef } from "react";
import { Camera, Loader2, X, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { updateProfile, uploadAvatar, removeAvatar, changeEmail, changePassword } from "../actions";
import type { UserProfile } from "../actions";

interface ProfileFormProps {
  profile: UserProfile;
  email: string;
}

export function ProfileForm({ profile, email }: ProfileFormProps) {
  const [displayName, setDisplayName] = useState(profile.display_name || "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [newEmail, setNewEmail] = useState(email);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const emailChanged = newEmail !== email;
  const passwordValid = newPassword.length >= 8 && newPassword === confirmPassword;

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

  const handleChangeEmail = async () => {
    if (!emailChanged) return;

    setIsChangingEmail(true);
    setMessage(null);

    const result = await changeEmail(newEmail);

    if (result.success) {
      setMessage({
        type: "success",
        text: "Confirmation email sent. Please check both your old and new email to confirm the change."
      });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to change email" });
    }

    setIsChangingEmail(false);
  };

  const handleChangePassword = async () => {
    if (!passwordValid) return;

    setIsChangingPassword(true);
    setMessage(null);

    const result = await changePassword(newPassword);

    if (result.success) {
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ type: "success", text: "Password changed successfully" });
    } else {
      setMessage({ type: "error", text: result.error || "Failed to change password" });
    }

    setIsChangingPassword(false);
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

      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="flex gap-2 max-w-md">
          <Input
            id="email"
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter your email"
          />
          {emailChanged && (
            <Button
              type="button"
              variant="outline"
              onClick={handleChangeEmail}
              disabled={isChangingEmail}
            >
              {isChangingEmail ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Change"
              )}
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Changing your email requires confirmation via both your old and new email addresses.
        </p>
      </div>

      {/* Password */}
      <div className="space-y-2">
        <Label htmlFor="newPassword">Change Password</Label>
        <div className="space-y-2 max-w-md">
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password"
          />
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
          {newPassword && (
            <div className="text-xs text-muted-foreground">
              {newPassword.length < 8 && (
                <p className="text-destructive">Password must be at least 8 characters</p>
              )}
              {newPassword.length >= 8 && confirmPassword && newPassword !== confirmPassword && (
                <p className="text-destructive">Passwords do not match</p>
              )}
            </div>
          )}
          <Button
            type="button"
            variant="outline"
            onClick={handleChangePassword}
            disabled={isChangingPassword || !passwordValid}
          >
            {isChangingPassword ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Changing...
              </>
            ) : (
              "Change Password"
            )}
          </Button>
        </div>
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
