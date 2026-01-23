// Type declarations for Editor.js plugins that don't have types
declare module "@editorjs/checklist" {
  import { BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";
  export default class Checklist implements BlockTool {
    constructor(config: BlockToolConstructorOptions);
    render(): HTMLElement;
    save(block: HTMLElement): object;
    static get toolbox(): { title: string; icon: string };
  }
}

declare module "@editorjs/link" {
  import { BlockTool, BlockToolConstructorOptions } from "@editorjs/editorjs";
  export default class LinkTool implements BlockTool {
    constructor(config: BlockToolConstructorOptions);
    render(): HTMLElement;
    save(block: HTMLElement): object;
    static get toolbox(): { title: string; icon: string };
  }
}
