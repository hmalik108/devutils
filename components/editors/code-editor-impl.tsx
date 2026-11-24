"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { basicSetup } from "codemirror";
import { EditorState, Compartment, type Extension } from "@codemirror/state";
import { EditorView, placeholder as cmPlaceholder, keymap } from "@codemirror/view";
import { indentWithTab } from "@codemirror/commands";
import { oneDark } from "@codemirror/theme-one-dark";
import type { CodeEditorProps } from "./code-editor";

async function loadLanguage(lang: CodeEditorProps["language"]): Promise<Extension> {
  switch (lang) {
    case "json":
      return (await import("@codemirror/lang-json")).json();
    case "yaml":
      return (await import("@codemirror/lang-yaml")).yaml();
    case "html":
      return (await import("@codemirror/lang-html")).html();
    default:
      return [];
  }
}

const baseTheme = EditorView.theme({
  "&": { backgroundColor: "var(--background)", fontSize: "13px" },
  ".cm-gutters": { backgroundColor: "var(--muted)", borderRight: "1px solid var(--border)", color: "var(--muted-foreground)" },
  ".cm-activeLineGutter": { backgroundColor: "transparent" },
});

export default function CodeEditorImpl({ value, onChange, language = "text", readOnly, label, minHeight = 240, maxHeight = 820, placeholder, invalid, id }: CodeEditorProps) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const onChangeRef = useRef(onChange);
  const theme = useRef(new Compartment());
  const lang = useRef(new Compartment());
  const ro = useRef(new Compartment());
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Create the editor once.
  useEffect(() => {
    if (!host.current) return;
    const v = new EditorView({
      parent: host.current,
      state: EditorState.create({
        doc: value,
        extensions: [
          basicSetup,
          keymap.of([indentWithTab]),
          EditorView.lineWrapping,
          baseTheme,
          theme.current.of([]),
          lang.current.of([]),
          ro.current.of([EditorState.readOnly.of(!!readOnly), EditorView.editable.of(!readOnly)]),
          placeholder ? cmPlaceholder(placeholder) : [],
          EditorView.contentAttributes.of({ "aria-label": label, ...(id ? { id } : {}), spellcheck: "false", autocorrect: "off", autocapitalize: "off" }),
          EditorView.updateListener.of((u) => {
            if (u.docChanged) onChangeRef.current?.(u.state.doc.toString());
          }),
          EditorView.theme({ "&": { minHeight: `${minHeight}px`, maxHeight: `${maxHeight}px` }, ".cm-scroller": { overflow: "auto" } }),
        ],
      }),
    });
    view.current = v;
    return () => {
      v.destroy();
      view.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep external value changes (Clear, Load sample, new output) in sync.
  useEffect(() => {
    const v = view.current;
    if (!v) return;
    const cur = v.state.doc.toString();
    if (cur !== value) v.dispatch({ changes: { from: 0, to: cur.length, insert: value } });
  }, [value]);

  useEffect(() => {
    view.current?.dispatch({ effects: theme.current.reconfigure(resolvedTheme === "dark" ? oneDark : []) });
  }, [resolvedTheme]);

  useEffect(() => {
    let cancelled = false;
    loadLanguage(language).then((ext) => {
      if (!cancelled) view.current?.dispatch({ effects: lang.current.reconfigure(ext) });
    });
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    view.current?.dispatch({ effects: ro.current.reconfigure([EditorState.readOnly.of(!!readOnly), EditorView.editable.of(!readOnly)]) });
  }, [readOnly]);

  return (
    <div
      ref={host}
      data-invalid={invalid || undefined}
      className="overflow-hidden rounded-md border border-input shadow-xs focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring data-[invalid]:border-destructive"
    />
  );
}
