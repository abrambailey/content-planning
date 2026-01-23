"use client";

import dynamic from "next/dynamic";
import type { EditorJSData } from "../../types";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamic import to avoid SSR issues with Editor.js
const EditorWrapper = dynamic(
  () => import("../../editor/editor-wrapper").then((mod) => mod.EditorWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="min-h-[300px] border rounded-md bg-background p-4">
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-5/6 mb-2" />
        <Skeleton className="h-4 w-4/6" />
      </div>
    ),
  }
);

interface ContentTabProps {
  body: EditorJSData | null;
  onChange: (body: EditorJSData) => void;
}

export function ContentTab({ body, onChange }: ContentTabProps) {
  return (
    <div className="h-full">
      <EditorWrapper
        data={body}
        onChange={onChange}
        placeholder="Start writing your content..."
      />
    </div>
  );
}
