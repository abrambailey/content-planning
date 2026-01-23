"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Loader2, FileText, Settings, Users, Calendar, Paperclip, MessageSquare, Package } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { createCampaign, updateContentItem, createContentItem } from "../../actions";
import type {
  ContentItem,
  ContentFilterOptions,
  ContentItemInput,
  EditorJSData,
  ContentAttachment,
  ContentLink,
  ContentLinkInput,
  CampaignSummary,
  ContentAssignment,
} from "../types";
import { ContentTab } from "./tabs/content-tab";
import { DetailsTab } from "./tabs/details-tab";
import { AssignmentsTab } from "./tabs/assignments-tab";
import { DatesTab } from "./tabs/dates-tab";
import { AttachmentsTab } from "./tabs/attachments-tab";
import { ProductsTab } from "./tabs/products-tab";
import { CommentsPanel } from "./comments-panel";

interface ContentEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ContentItem | null;
  filterOptions: ContentFilterOptions;
  onSave: () => void;
  currentUserId?: string;
  highlightCommentId?: number | null;
}

export function ContentEditModal({
  open,
  onOpenChange,
  item,
  filterOptions,
  onSave,
  currentUserId,
  highlightCommentId,
}: ContentEditModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [activeTab, setActiveTab] = useState("content");
  const [localCampaigns, setLocalCampaigns] = useState<CampaignSummary[]>(filterOptions.campaigns);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [contentItemId, setContentItemId] = useState<number | null>(null);

  // Form state
  const [formData, setFormData] = useState<ContentItemInput>({
    title: "",
    content_type_id: null,
    workflow_status_id: null,
    campaign_id: null,
    priority: "medium",
    due_date: null,
    scheduled_date: null,
    scheduled_time: null,
    notes: null,
    storyblok_url: null,
    body: null,
  });

  // Local state for attachments/links/assignments (for existing items)
  const [attachments, setAttachments] = useState<ContentAttachment[]>([]);
  const [links, setLinks] = useState<ContentLink[]>([]);
  const [assignments, setAssignments] = useState<ContentAssignment[]>([]);

  // Pending state for new items
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [pendingLinks, setPendingLinks] = useState<ContentLinkInput[]>([]);

  // Sync campaigns with filterOptions
  useEffect(() => {
    setLocalCampaigns(filterOptions.campaigns);
  }, [filterOptions.campaigns]);

  // Initialize form when item changes
  useEffect(() => {
    if (open) {
      if (item) {
        setContentItemId(item.id);
        setFormData({
          title: item.title,
          content_type_id: item.content_type?.id || null,
          workflow_status_id: item.workflow_status?.id || null,
          campaign_id: item.campaign?.id || null,
          priority: item.priority,
          due_date: item.due_date,
          scheduled_date: item.scheduled_date,
          scheduled_time: item.scheduled_time,
          notes: item.notes,
          storyblok_url: item.storyblok_url,
          body: item.body,
        });
        setAttachments(item.attachments || []);
        setLinks(item.links || []);
        setAssignments(item.assignments || []);
        setPendingFiles([]);
        setPendingLinks([]);
      } else {
        setContentItemId(null);
        setFormData({
          title: "",
          content_type_id: null,
          workflow_status_id: null,
          campaign_id: null,
          priority: "medium",
          due_date: null,
          scheduled_date: null,
          scheduled_time: null,
          notes: null,
          storyblok_url: null,
          body: null,
        });
        setAttachments([]);
        setLinks([]);
        setAssignments([]);
        setPendingFiles([]);
        setPendingLinks([]);
      }
      setSaveStatus("idle");
      setActiveTab("content");
    }
  }, [item, open]);

  // Handle form field changes
  const handleFormChange = useCallback((updates: Partial<ContentItemInput>) => {
    setFormData((prev) => ({ ...prev, ...updates }));
    // Trigger auto-save for existing items
    if (contentItemId) {
      setSaveStatus("saving");
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave({ ...formData, ...updates });
      }, 1000);
    }
  }, [contentItemId, formData]);

  // Handle body (Editor.js) changes
  const handleBodyChange = useCallback((body: EditorJSData) => {
    setFormData((prev) => ({ ...prev, body }));
    // Trigger auto-save for existing items
    if (contentItemId) {
      setSaveStatus("saving");
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      saveTimeoutRef.current = setTimeout(() => {
        handleAutoSave({ ...formData, body });
      }, 1500); // Slightly longer debounce for editor content
    }
  }, [contentItemId, formData]);

  // Auto-save for existing items
  const handleAutoSave = useCallback(async (data: ContentItemInput) => {
    if (!contentItemId) return;

    const result = await updateContentItem(contentItemId, data);
    if (result.success) {
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("idle");
    }
  }, [contentItemId]);

  // Create campaign handler
  const handleCreateCampaign = async (name: string): Promise<string | null> => {
    const result = await createCampaign(name);
    if (result.success && result.id) {
      const newCampaign = {
        id: result.id,
        name,
        color: "#6366f1",
      };
      setLocalCampaigns((prev) =>
        [...prev, newCampaign].sort((a, b) => a.name.localeCompare(b.name))
      );
      return result.id.toString();
    }
    return null;
  };

  // Handle save for new items
  const handleSaveNew = async () => {
    if (!formData.title.trim()) return;

    setIsSaving(true);
    try {
      const result = await createContentItem(formData);
      if (result.success && result.id) {
        setContentItemId(result.id);
        // TODO: Handle pending files and links
        onSave();
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Cleanup timeout when dialog closes or component unmounts
  useEffect(() => {
    if (!open && saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [open]);

  const isNewItem = !item;
  const isBestList = item?.content_type?.slug === "best-list" ||
    filterOptions.types.find(t => t.id === formData.content_type_id)?.slug === "best-list";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-6xl w-[95vw] h-[90vh] p-0 gap-0 flex flex-col sm:max-w-6xl"
        showCloseButton={true}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0 pr-12">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <DialogTitle className="text-lg font-semibold truncate">
              {item?.title || "New Content"}
            </DialogTitle>
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="text-xs text-green-600">Saved</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isNewItem && (
              <Button
                onClick={handleSaveNew}
                disabled={isSaving || !formData.title.trim()}
                size="sm"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Left pane - Tabs */}
          <div className="flex-1 flex flex-col min-w-0 border-r md:border-r-0">
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="flex flex-col h-full"
            >
              <TabsList className={`grid w-full ${isBestList ? "grid-cols-6 md:grid-cols-6" : "grid-cols-5 md:grid-cols-5"} rounded-none border-b px-2 h-auto py-1 bg-transparent`}>
                <TabsTrigger
                  value="content"
                  className="gap-1.5 data-[state=active]:bg-muted rounded-md py-2"
                >
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Content</span>
                </TabsTrigger>
                <TabsTrigger
                  value="details"
                  className="gap-1.5 data-[state=active]:bg-muted rounded-md py-2"
                >
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Details</span>
                </TabsTrigger>
                {isBestList && (
                  <TabsTrigger
                    value="products"
                    className="gap-1.5 data-[state=active]:bg-muted rounded-md py-2"
                  >
                    <Package className="h-4 w-4" />
                    <span className="hidden sm:inline">Products</span>
                  </TabsTrigger>
                )}
                <TabsTrigger
                  value="assignments"
                  className="gap-1.5 data-[state=active]:bg-muted rounded-md py-2"
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Team</span>
                </TabsTrigger>
                <TabsTrigger
                  value="dates"
                  className="gap-1.5 data-[state=active]:bg-muted rounded-md py-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span className="hidden sm:inline">Dates</span>
                </TabsTrigger>
                <TabsTrigger
                  value="attachments"
                  className="gap-1.5 data-[state=active]:bg-muted rounded-md py-2"
                >
                  <Paperclip className="h-4 w-4" />
                  <span className="hidden sm:inline">Files</span>
                </TabsTrigger>
                {/* Mobile-only comments tab */}
                <TabsTrigger
                  value="comments"
                  className="gap-1.5 data-[state=active]:bg-muted rounded-md py-2 md:hidden"
                >
                  <MessageSquare className="h-4 w-4" />
                </TabsTrigger>
              </TabsList>

              <div className="flex-1 overflow-y-auto p-4">
                <TabsContent value="content" className="mt-0 h-full">
                  <ContentTab
                    body={formData.body || null}
                    onChange={handleBodyChange}
                  />
                </TabsContent>

                <TabsContent value="details" className="mt-0">
                  <DetailsTab
                    formData={formData}
                    onChange={handleFormChange}
                    filterOptions={filterOptions}
                    localCampaigns={localCampaigns}
                    onCreateCampaign={handleCreateCampaign}
                  />
                </TabsContent>

                {isBestList && (
                  <TabsContent value="products" className="mt-0">
                    <ProductsTab contentItemId={contentItemId} />
                  </TabsContent>
                )}

                <TabsContent value="assignments" className="mt-0">
                  <AssignmentsTab
                    contentItemId={contentItemId}
                    assignments={assignments}
                    users={filterOptions.users}
                    onAssignmentsChange={setAssignments}
                  />
                </TabsContent>

                <TabsContent value="dates" className="mt-0">
                  <DatesTab
                    formData={formData}
                    onChange={handleFormChange}
                  />
                </TabsContent>

                <TabsContent value="attachments" className="mt-0">
                  <AttachmentsTab
                    contentItemId={contentItemId}
                    attachments={attachments}
                    links={links}
                    onAttachmentsChange={setAttachments}
                    onLinksChange={setLinks}
                    pendingFiles={pendingFiles}
                    onPendingFilesChange={setPendingFiles}
                    pendingLinks={pendingLinks}
                    onPendingLinksChange={setPendingLinks}
                  />
                </TabsContent>

                {/* Mobile comments tab content */}
                <TabsContent value="comments" className="mt-0 md:hidden h-full">
                  <CommentsPanel
                    contentItemId={contentItemId}
                    currentUserId={currentUserId}
                    users={filterOptions.users}
                    className="h-full max-h-[calc(90vh-140px)]"
                    highlightCommentId={highlightCommentId}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {/* Right pane - Comments (desktop only) */}
          <div className="hidden md:flex w-80 lg:w-96 border-l flex-col min-h-0 bg-muted/30">
            <CommentsPanel
              contentItemId={contentItemId}
              currentUserId={currentUserId}
              users={filterOptions.users}
              className="h-full"
              highlightCommentId={highlightCommentId}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
