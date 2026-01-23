"use client";

import { cn } from "@/lib/utils";
import { FileText, Lightbulb, FolderOpen, Calendar, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: "content" | "idea" | "folder" | "calendar" | "search";
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

const ICONS = {
  content: FileText,
  idea: Lightbulb,
  folder: FolderOpen,
  calendar: Calendar,
  search: Search,
};

export function EmptyState({
  icon = "folder",
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const Icon = ICONS[icon];

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <div className="mb-4 rounded-full bg-muted p-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold">{title}</h3>
      <p className="mb-4 max-w-sm text-sm text-muted-foreground">
        {description}
      </p>
      {action && (
        <Button onClick={action.onClick}>{action.label}</Button>
      )}
    </div>
  );
}
