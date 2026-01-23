"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ContentItemInput } from "../../types";

interface DatesTabProps {
  formData: ContentItemInput;
  onChange: (updates: Partial<ContentItemInput>) => void;
}

export function DatesTab({ formData, onChange }: DatesTabProps) {
  return (
    <div className="space-y-4 p-1">
      <div className="grid gap-2">
        <Label htmlFor="due_date">Due Date</Label>
        <Input
          id="due_date"
          type="date"
          value={formData.due_date || ""}
          onChange={(e) => onChange({ due_date: e.target.value || null })}
        />
        <p className="text-xs text-muted-foreground">
          The deadline for completing this content.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="scheduled_date">Scheduled Publication Date</Label>
        <Input
          id="scheduled_date"
          type="date"
          value={formData.scheduled_date || ""}
          onChange={(e) => onChange({ scheduled_date: e.target.value || null })}
        />
        <p className="text-xs text-muted-foreground">
          When this content is scheduled to be published.
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="scheduled_time">Scheduled Time</Label>
        <Input
          id="scheduled_time"
          type="time"
          value={formData.scheduled_time || ""}
          onChange={(e) => onChange({ scheduled_time: e.target.value || null })}
        />
        <p className="text-xs text-muted-foreground">
          The specific time of day for publication (optional).
        </p>
      </div>
    </div>
  );
}
