"use client";

import { useState, useCallback } from "react";
import { Plus, X, Link as LinkIcon, ExternalLink, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ContentLink, ContentLinkInput } from "./types";
import { addContentLink, updateContentLink, deleteContentLink } from "../actions";

interface LinksEditorProps {
  contentItemId: number | null;
  links: ContentLink[];
  onLinksChange: (links: ContentLink[]) => void;
  pendingLinks?: ContentLinkInput[];
  onPendingLinksChange?: (links: ContentLinkInput[]) => void;
}

interface EditableLink extends ContentLinkInput {
  id?: number;
  isNew?: boolean;
}

export function LinksEditor({
  contentItemId,
  links,
  onLinksChange,
  pendingLinks = [],
  onPendingLinksChange,
}: LinksEditorProps) {
  const [editingLink, setEditingLink] = useState<EditableLink | null>(null);

  const handleAddLink = useCallback(() => {
    setEditingLink({
      url: "",
      name: "",
      description: "",
      isNew: true,
    });
  }, []);

  const handleSaveLink = useCallback(async () => {
    if (!editingLink || !editingLink.url) return;

    if (!contentItemId) {
      // Store as pending for new items
      if (onPendingLinksChange) {
        onPendingLinksChange([...pendingLinks, {
          url: editingLink.url,
          name: editingLink.name,
          description: editingLink.description,
        }]);
      }
      setEditingLink(null);
      return;
    }

    if (editingLink.isNew) {
      const result = await addContentLink(contentItemId, {
        url: editingLink.url,
        name: editingLink.name,
        description: editingLink.description,
      });
      if (result.success && result.link) {
        onLinksChange([...links, result.link]);
      }
    } else if (editingLink.id) {
      const result = await updateContentLink(editingLink.id, {
        url: editingLink.url,
        name: editingLink.name,
        description: editingLink.description,
      });
      if (result.success) {
        onLinksChange(
          links.map((l) =>
            l.id === editingLink.id
              ? { ...l, url: editingLink.url, name: editingLink.name || null, description: editingLink.description || null }
              : l
          )
        );
      }
    }
    setEditingLink(null);
  }, [editingLink, contentItemId, links, onLinksChange, pendingLinks, onPendingLinksChange]);

  const handleEditLink = useCallback((link: ContentLink) => {
    setEditingLink({
      id: link.id,
      url: link.url,
      name: link.name || "",
      description: link.description || "",
      isNew: false,
    });
  }, []);

  const handleDeleteLink = useCallback(
    async (linkId: number) => {
      const result = await deleteContentLink(linkId);
      if (result.success) {
        onLinksChange(links.filter((l) => l.id !== linkId));
      }
    },
    [links, onLinksChange]
  );

  const handleRemovePending = useCallback(
    (index: number) => {
      if (onPendingLinksChange) {
        onPendingLinksChange(pendingLinks.filter((_, i) => i !== index));
      }
    },
    [pendingLinks, onPendingLinksChange]
  );

  const handleCancelEdit = useCallback(() => {
    setEditingLink(null);
  }, []);

  return (
    <div className="space-y-3">
      {/* Existing Links */}
      {links.map((link) => (
        <div
          key={link.id}
          className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 group"
        >
          <GripVertical className="h-4 w-4 mt-1 text-muted-foreground/50 opacity-0 group-hover:opacity-100 cursor-grab" />
          <LinkIcon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium hover:underline flex items-center gap-1"
            >
              {link.name || link.url}
              <ExternalLink className="h-3 w-3" />
            </a>
            {link.description && (
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                {link.description}
              </p>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleEditLink(link)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => handleDeleteLink(link.id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}

      {/* Pending Links (for new items) */}
      {pendingLinks.map((link, index) => (
        <div
          key={`pending-${index}`}
          className="flex items-start gap-2 p-2 rounded-lg bg-muted/50 group"
        >
          <LinkIcon className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{link.name || link.url}</p>
            <p className="text-xs text-muted-foreground">Pending save</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => handleRemovePending(index)}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ))}

      {/* Edit/Add Form */}
      {editingLink && (
        <div className="p-3 rounded-lg border bg-background space-y-2">
          <Input
            placeholder="URL (required)"
            value={editingLink.url}
            onChange={(e) =>
              setEditingLink({ ...editingLink, url: e.target.value })
            }
            className="text-sm"
          />
          <Input
            placeholder="Name (optional)"
            value={editingLink.name || ""}
            onChange={(e) =>
              setEditingLink({ ...editingLink, name: e.target.value })
            }
            className="text-sm"
          />
          <Input
            placeholder="Description (optional)"
            value={editingLink.description || ""}
            onChange={(e) =>
              setEditingLink({ ...editingLink, description: e.target.value })
            }
            className="text-sm"
          />
          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelEdit}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSaveLink}
              disabled={!editingLink.url}
            >
              {editingLink.isNew ? "Add" : "Save"}
            </Button>
          </div>
        </div>
      )}

      {/* Add Button */}
      {!editingLink && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full"
          onClick={handleAddLink}
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Link
        </Button>
      )}
    </div>
  );
}
