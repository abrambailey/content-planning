"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Combobox } from "@/components/ui/combobox";
import { createCampaign } from "../actions";
import type { ContentItem, ContentFilterOptions, ContentItemInput } from "./types";

interface ContentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ContentItem | null;
  filterOptions: ContentFilterOptions;
  onSubmit: (input: ContentItemInput) => Promise<void>;
}

export function ContentFormDialog({
  open,
  onOpenChange,
  item,
  filterOptions,
  onSubmit,
}: ContentFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localCampaigns, setLocalCampaigns] = useState(filterOptions.campaigns);
  const [formData, setFormData] = useState<ContentItemInput>({
    title: "",
    content_type_id: null,
    workflow_status_id: null,
    campaign_id: null,
    priority: "medium",
    due_date: null,
    scheduled_date: null,
    notes: null,
    storyblok_url: null,
  });

  // Sync local campaigns with filterOptions
  useEffect(() => {
    setLocalCampaigns(filterOptions.campaigns);
  }, [filterOptions.campaigns]);

  useEffect(() => {
    if (item) {
      setFormData({
        title: item.title,
        content_type_id: item.content_type?.id || null,
        workflow_status_id: item.workflow_status?.id || null,
        campaign_id: item.campaign?.id || null,
        priority: item.priority,
        due_date: item.due_date,
        scheduled_date: item.scheduled_date,
        notes: item.notes,
        storyblok_url: item.storyblok_url,
      });
    } else {
      setFormData({
        title: "",
        content_type_id: null,
        workflow_status_id: null,
        campaign_id: null,
        priority: "medium",
        due_date: null,
        scheduled_date: null,
        notes: null,
        storyblok_url: null,
      });
    }
  }, [item, open]);

  const handleCreateCampaign = async (name: string): Promise<string | null> => {
    const result = await createCampaign(name);
    if (result.success && result.id) {
      // Add the new campaign to local state
      const newCampaign = {
        id: result.id,
        name,
        color: "#6366f1", // Default color, will be replaced on next fetch
      };
      setLocalCampaigns((prev) => [...prev, newCampaign].sort((a, b) => a.name.localeCompare(b.name)));
      return result.id.toString();
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{item ? "Edit Details" : "Create Content"}</DialogTitle>
            <DialogDescription>
              {item
                ? "Update the content item details."
                : "Add a new content item to your pipeline."}
            </DialogDescription>
          </DialogHeader>

          <div className="-mx-6 max-h-[60vh] overflow-y-auto px-6">
            <div className="grid gap-4 py-4">
            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Enter content title"
                required
              />
            </div>

            {/* Row: Content Type + Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="content_type">Content Type</Label>
                <Select
                  value={formData.content_type_id?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      content_type_id: value === "none" ? null : Number(value),
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {filterOptions.types.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.workflow_status_id?.toString() || "none"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      workflow_status_id: value === "none" ? null : Number(value),
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Default (Draft)</SelectItem>
                    {filterOptions.statuses.map((status) => (
                      <SelectItem key={status.id} value={status.id.toString()}>
                        {status.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Row: Campaign + Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="campaign">Campaign</Label>
                <Combobox
                  options={localCampaigns.map((campaign) => ({
                    value: campaign.id.toString(),
                    label: campaign.name,
                    color: campaign.color,
                  }))}
                  value={formData.campaign_id?.toString() || null}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      campaign_id: value ? Number(value) : null,
                    })
                  }
                  onCreate={handleCreateCampaign}
                  placeholder="Select campaign"
                  searchPlaceholder="Search or create..."
                  emptyText="No campaigns found."
                  createText="Create campaign"
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority || "medium"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      priority: value as ContentItemInput["priority"],
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Notes */}
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes || ""}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value || null })
                }
                placeholder="Add any notes or context..."
                rows={3}
              />
            </div>

            {/* Storyblok URL */}
            <div className="grid gap-2">
              <Label htmlFor="storyblok_url">Storyblok URL</Label>
              <Input
                id="storyblok_url"
                type="url"
                value={formData.storyblok_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, storyblok_url: e.target.value || null })
                }
                placeholder="https://app.storyblok.com/..."
              />
            </div>
            </div>
          </div>

          <DialogFooter className="-mx-6 -mb-6 rounded-b-lg border-t bg-muted/50 p-4">
            <Button type="submit" disabled={isSubmitting || !formData.title}>
              {isSubmitting ? "Saving..." : item ? "Save changes" : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
