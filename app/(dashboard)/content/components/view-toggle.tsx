"use client";

import { LayoutList, Kanban, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ContentView } from "./types";

interface ViewToggleProps {
  view: ContentView;
  onViewChange: (view: ContentView) => void;
}

const views: { value: ContentView; label: string; icon: typeof LayoutList }[] = [
  { value: "kanban", label: "Kanban", icon: Kanban },
  { value: "list", label: "List", icon: LayoutList },
  { value: "calendar", label: "Calendar", icon: Calendar },
];

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center rounded-md border bg-muted p-1">
      {views.map((v) => {
        const Icon = v.icon;
        const isActive = view === v.value;
        return (
          <Button
            key={v.value}
            variant="ghost"
            size="sm"
            className={cn(
              "h-7 px-2.5",
              isActive && "bg-background shadow-sm"
            )}
            onClick={() => onViewChange(v.value)}
          >
            <Icon className="h-4 w-4" />
            <span className="text-xs">{v.label}</span>
          </Button>
        );
      })}
    </div>
  );
}
