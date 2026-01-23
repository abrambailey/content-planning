"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, Image, Film, Music, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ContentAttachment } from "./types";
import { uploadAttachment, deleteAttachment, getAttachmentUrl } from "../actions";

interface AttachmentUploadProps {
  contentItemId: number | null;
  attachments: ContentAttachment[];
  onAttachmentsChange: (attachments: ContentAttachment[]) => void;
  pendingFiles?: File[];
  onPendingFilesChange?: (files: File[]) => void;
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return File;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("video/")) return Film;
  if (mimeType.startsWith("audio/")) return Music;
  if (mimeType.includes("pdf") || mimeType.includes("document")) return FileText;
  return File;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface UploadingFile {
  file: File;
  progress: number;
  error?: string;
}

export function AttachmentUpload({
  contentItemId,
  attachments,
  onAttachmentsChange,
  pendingFiles = [],
  onPendingFilesChange,
}: AttachmentUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);

      // If no contentItemId yet (new item), store as pending
      if (!contentItemId) {
        if (onPendingFilesChange) {
          onPendingFilesChange([...pendingFiles, ...fileArray]);
        }
        return;
      }

      // Upload each file
      for (const file of fileArray) {
        setUploadingFiles((prev) => [...prev, { file, progress: 0 }]);

        const formData = new FormData();
        formData.append("file", file);

        const result = await uploadAttachment(contentItemId, formData);

        if (result.success && result.attachment) {
          onAttachmentsChange([...attachments, result.attachment]);
        }

        setUploadingFiles((prev) =>
          prev.filter((u) => u.file.name !== file.name)
        );
      }
    },
    [contentItemId, attachments, onAttachmentsChange, pendingFiles, onPendingFilesChange]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      if (e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
        handleFiles(e.target.files);
        e.target.value = "";
      }
    },
    [handleFiles]
  );

  const handleRemoveAttachment = useCallback(
    async (attachment: ContentAttachment) => {
      const result = await deleteAttachment(attachment.id);
      if (result.success) {
        onAttachmentsChange(attachments.filter((a) => a.id !== attachment.id));
      }
    },
    [attachments, onAttachmentsChange]
  );

  const handleRemovePending = useCallback(
    (index: number) => {
      if (onPendingFilesChange) {
        onPendingFilesChange(pendingFiles.filter((_, i) => i !== index));
      }
    },
    [pendingFiles, onPendingFilesChange]
  );

  const handleDownload = useCallback(async (attachment: ContentAttachment) => {
    const result = await getAttachmentUrl(attachment.storage_path);
    if (result.url) {
      window.open(result.url, "_blank");
    }
  }, []);

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-4 text-center transition-colors cursor-pointer",
          isDragOver
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
        <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          Drag and drop files here, or click to select
        </p>
      </div>

      {/* Uploading Files */}
      {uploadingFiles.map((uploading, index) => (
        <div
          key={`uploading-${index}`}
          className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
        >
          <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">{uploading.file.name}</p>
            <Progress value={50} className="h-1 mt-1" />
          </div>
        </div>
      ))}

      {/* Pending Files (for new items) */}
      {pendingFiles.map((file, index) => {
        const FileIcon = getFileIcon(file.type);
        return (
          <div
            key={`pending-${index}`}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
          >
            <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{file.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(file.size)} - Pending upload
              </p>
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
        );
      })}

      {/* Existing Attachments */}
      {attachments.map((attachment) => {
        const FileIcon = getFileIcon(attachment.mime_type);
        return (
          <div
            key={attachment.id}
            className="flex items-center gap-2 p-2 rounded-lg bg-muted/50"
          >
            <FileIcon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <button
              type="button"
              className="flex-1 min-w-0 text-left hover:underline"
              onClick={() => handleDownload(attachment)}
            >
              <p className="text-sm truncate">{attachment.file_name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.file_size)}
              </p>
            </button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={() => handleRemoveAttachment(attachment)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        );
      })}
    </div>
  );
}
