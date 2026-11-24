"use client";

import dynamic from "next/dynamic";

export interface CodeEditorProps {
  value: string;
  onChange?: (v: string) => void;
  language?: "json" | "yaml" | "html" | "text";
  readOnly?: boolean;
  /** Accessible name for the editing surface. */
  label: string;
  id?: string;
  minHeight?: number;
  maxHeight?: number;
  placeholder?: string;
  invalid?: boolean;
}

const LazyEditor = dynamic(() => import("./code-editor-impl"), {
  ssr: false,
  loading: () => <div aria-hidden className="absolute inset-0 animate-pulse rounded-md border border-input bg-muted/40" />,
});

/**
 * CodeMirror 6 editor, loaded only on the client and only on pages that use it.
 * The wrapper reserves the editor's height so the page doesn't shift (CLS).
 */
export function CodeEditor(props: CodeEditorProps) {
  return (
    <div className="code-editor relative" data-fs-fill style={{ minHeight: props.minHeight ?? 240 }}>
      <LazyEditor {...props} />
    </div>
  );
}
