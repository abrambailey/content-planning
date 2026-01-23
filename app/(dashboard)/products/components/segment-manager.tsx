"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Save, FolderOpen, Trash2, MoreHorizontal } from "lucide-react";
import type { ProductFilters, ProductSegment, SortField } from "./types";

interface SegmentManagerProps {
  segments: ProductSegment[];
  currentFilters: ProductFilters;
  sortPrimary: SortField | null;
  sortPrimaryDesc: boolean;
  sortSecondary: SortField | null;
  sortSecondaryDesc: boolean;
  onSaveSegment: (name: string) => Promise<void>;
  onLoadSegment: (segment: ProductSegment) => void;
  onDeleteSegment: (segmentId: string) => Promise<void>;
}

export function SegmentManager({
  segments,
  onSaveSegment,
  onLoadSegment,
  onDeleteSegment,
}: SegmentManagerProps) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [segmentName, setSegmentName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSave = async () => {
    if (!segmentName.trim()) return;
    setIsSaving(true);
    try {
      await onSaveSegment(segmentName.trim());
      setSegmentName("");
      setSaveDialogOpen(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (segmentId: string) => {
    setDeletingId(segmentId);
    try {
      await onDeleteSegment(segmentId);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Load Segment */}
      {segments.length > 0 && (
        <Select
          onValueChange={(value) => {
            const segment = segments.find((s) => s.id === value);
            if (segment) onLoadSegment(segment);
          }}
        >
          <SelectTrigger className="w-[180px]">
            <FolderOpen className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Load segment..." />
          </SelectTrigger>
          <SelectContent>
            {segments.map((segment) => (
              <div key={segment.id} className="flex items-center">
                <SelectItem value={segment.id} className="flex-1">
                  {segment.name}
                </SelectItem>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="end">
                    <Button
                      variant="destructive"
                      size="sm"
                      disabled={deletingId === segment.id}
                      onClick={() => handleDelete(segment.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {deletingId === segment.id ? "Deleting..." : "Delete"}
                    </Button>
                  </PopoverContent>
                </Popover>
              </div>
            ))}
          </SelectContent>
        </Select>
      )}

      {/* Save Segment */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Save className="mr-2 h-4 w-4" />
            Save Segment
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current Segment</DialogTitle>
            <DialogDescription>
              Save your current filter and sort settings as a reusable segment.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="segment-name">Segment Name</Label>
              <Input
                id="segment-name"
                placeholder="e.g., OTC Rechargeable"
                value={segmentName}
                onChange={(e) => setSegmentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!segmentName.trim() || isSaving}>
              {isSaving ? "Saving..." : "Save Segment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
