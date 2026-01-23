"use client";

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
import type { ContentFilterOptions, ContentItemInput, CampaignSummary } from "../../types";

interface DetailsTabProps {
  formData: ContentItemInput;
  onChange: (updates: Partial<ContentItemInput>) => void;
  filterOptions: ContentFilterOptions;
  localCampaigns: CampaignSummary[];
  onCreateCampaign: (name: string) => Promise<string | null>;
}

export function DetailsTab({
  formData,
  onChange,
  filterOptions,
  localCampaigns,
  onCreateCampaign,
}: DetailsTabProps) {
  return (
    <div className="space-y-4 p-1">
      {/* Title */}
      <div className="grid gap-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => onChange({ title: e.target.value })}
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
              onChange({
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
              onChange({
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
              onChange({
                campaign_id: value ? Number(value) : null,
              })
            }
            onCreate={onCreateCampaign}
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
              onChange({
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
          onChange={(e) => onChange({ notes: e.target.value || null })}
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
            onChange({ storyblok_url: e.target.value || null })
          }
          placeholder="https://app.storyblok.com/..."
        />
      </div>
    </div>
  );
}
