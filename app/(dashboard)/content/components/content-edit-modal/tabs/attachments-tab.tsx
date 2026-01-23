"use client";

import { Paperclip, Link as LinkIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AttachmentUpload } from "../../attachment-upload";
import { LinksEditor } from "../../links-editor";
import type { ContentAttachment, ContentLink, ContentLinkInput } from "../../types";

interface AttachmentsTabProps {
  contentItemId: number | null;
  attachments: ContentAttachment[];
  links: ContentLink[];
  onAttachmentsChange: (attachments: ContentAttachment[]) => void;
  onLinksChange: (links: ContentLink[]) => void;
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
  pendingLinks?: ContentLinkInput[];
  onPendingLinksChange?: (links: ContentLinkInput[]) => void;
}

export function AttachmentsTab({
  contentItemId,
  attachments,
  links,
  onAttachmentsChange,
  onLinksChange,
  pendingFiles,
  onPendingFilesChange,
  pendingLinks,
  onPendingLinksChange,
}: AttachmentsTabProps) {
  return (
    <Tabs defaultValue="attachments" className="h-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="attachments" className="gap-2">
          <Paperclip className="h-4 w-4" />
          Files
          {attachments.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({attachments.length})
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="links" className="gap-2">
          <LinkIcon className="h-4 w-4" />
          Links
          {links.length > 0 && (
            <span className="text-xs text-muted-foreground">
              ({links.length})
            </span>
          )}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="attachments" className="mt-4">
        <AttachmentUpload
          contentItemId={contentItemId}
          attachments={attachments}
          onAttachmentsChange={onAttachmentsChange}
          pendingFiles={pendingFiles}
          onPendingFilesChange={onPendingFilesChange}
        />
      </TabsContent>

      <TabsContent value="links" className="mt-4">
        <LinksEditor
          contentItemId={contentItemId}
          links={links}
          onLinksChange={onLinksChange}
          pendingLinks={pendingLinks}
          onPendingLinksChange={onPendingLinksChange}
        />
      </TabsContent>
    </Tabs>
  );
}
