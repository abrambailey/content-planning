// Editor.js tools configuration
// Using dynamic imports in editor-wrapper.tsx to avoid SSR issues
// Types are complex/incompatible across Editor.js plugins, so we use `any`

import Header from "@editorjs/header";
import List from "@editorjs/list";
import Checklist from "@editorjs/checklist";
import Quote from "@editorjs/quote";
import Code from "@editorjs/code";
import LinkTool from "@editorjs/link";
import Table from "@editorjs/table";
import Paragraph from "@editorjs/paragraph";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EDITOR_TOOLS: Record<string, any> = {
  header: {
    class: Header,
    config: {
      levels: [2, 3, 4],
      defaultLevel: 2,
    },
  },
  list: {
    class: List,
    inlineToolbar: true,
    config: {
      defaultStyle: "unordered",
    },
  },
  checklist: {
    class: Checklist,
    inlineToolbar: true,
  },
  quote: {
    class: Quote,
    inlineToolbar: true,
    config: {
      quotePlaceholder: "Enter a quote",
      captionPlaceholder: "Quote author",
    },
  },
  code: {
    class: Code,
    config: {
      placeholder: "Enter code here...",
    },
  },
  linkTool: {
    class: LinkTool,
  },
  table: {
    class: Table,
    inlineToolbar: true,
    config: {
      rows: 2,
      cols: 3,
    },
  },
  paragraph: {
    class: Paragraph,
    inlineToolbar: true,
  },
};
