"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  color?: string;
  className?: string;
}

// Default colors for common statuses
const STATUS_COLORS: Record<string, string> = {
  draft: "#9CA3AF",
  in_review: "#F59E0B",
  needs_revision: "#EF4444",
  approved: "#10B981",
  scheduled: "#6366F1",
  published: "#059669",
  archived: "#6B7280",
  // Ideas
  submitted: "#9CA3AF",
  under_review: "#F59E0B",
  rejected: "#EF4444",
  converted: "#10B981",
  // Campaigns
  planning: "#9CA3AF",
  active: "#10B981",
  completed: "#059669",
  cancelled: "#EF4444",
  // Briefs
  ready: "#10B981",
  assigned: "#6366F1",
  in_progress: "#F59E0B",
};

function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace("#", "");
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? "#000000" : "#FFFFFF";
}

function formatStatusLabel(status: string): string {
  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function StatusBadge({ status, color, className }: StatusBadgeProps) {
  const bgColor = color || STATUS_COLORS[status] || "#6B7280";
  const textColor = getContrastColor(bgColor);

  return (
    <Badge
      className={cn("whitespace-nowrap", className)}
      style={{
        backgroundColor: bgColor,
        color: textColor,
        borderColor: bgColor,
      }}
    >
      {formatStatusLabel(status)}
    </Badge>
  );
}
