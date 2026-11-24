"use client";

import { useMemo, useState } from "react";
import { Eraser, FileInput } from "lucide-react";
import { CodeEditor } from "@/components/editors/code-editor";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
import { CopyButton } from "@/components/tools/copy-button";
import { DownloadButton } from "@/components/tools/download-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel, Toolbar } from "@/components/tools/tool-panel";
import { useDebounced } from "./use-debounced";
import { buildTree, type TreeMode } from "@/features/json/tree";
import { checkInputSize } from "@/lib/limits";

const TOOL = "json-yaml-tree";
const DATA_SAMPLE = `service: checkout
replicas: 3
image:
  repository: ghcr.io/example/checkout
  tag: "1.8.2"
env:
  - name: LOG_LEVEL
    value: info
  - name: FEATURE_FLAGS
    value: "fast-pay,new-ui"
resources:
  limits: { cpu: "500m", memory: 256Mi }
`;
const SCHEMA_SAMPLE = JSON.stringify(
  {
    $schema: "https://json-schema.org/draft/2020-12/schema",
    title: "User",
    type: "object",
    required: ["id", "email"],
    properties: {
      id: { type: "integer", minimum: 1 },
      email: { type: "string", format: "email", maxLength: 254 },
      roles: { type: "array", items: { type: "string", enum: ["admin", "dev", "viewer"] }, minItems: 1, uniqueItems: true },
      address: {
        type: "object",
        properties: { city: { type: "string" }, zip: { type: "string", pattern: "^[0-9]{5}$" } },
        required: ["city"],
      },
    },
    additionalProperties: false,
  },
  null,
  2,
);

export default function JsonYamlTreeTool() {
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<"auto" | TreeMode>("auto");
  const [style, setStyle] = useState<"unicode" | "ascii">("unicode");
  const debounced = useDebounced(input, 200);

  const result = useMemo(() => {
    if (!debounced.trim()) return null;
    const big = checkInputSize(debounced);
    if (big) return { ok: false as const, message: big };
    return buildTree(debounced, { mode, style });
  }, [debounced, mode, style]);

  const tree = result?.ok ? result.value.tree : "";

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <Segmented label="Mode" value={mode} onChange={setMode} options={[{ value: "auto", label: "Auto-detect" }, { value: "data", label: "Data" }, { value: "schema", label: "Schema" }]} />
        <Segmented label="Tree style" value={style} onChange={setStyle} options={[{ value: "unicode", label: "├── Unicode" }, { value: "ascii", label: "|-- ASCII" }]} />
      </Toolbar>

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel
          title="JSON or YAML input"
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={() => setInput(DATA_SAMPLE)}>
                <FileInput /> Data sample
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput(SCHEMA_SAMPLE)}>
                <FileInput /> Schema sample
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInput("")}>
                <Eraser /> Clear
              </Button>
            </>
          }
        >
          <CodeEditor value={input} onChange={setInput} language={input.trimStart().startsWith("{") || input.trimStart().startsWith("[") ? "json" : "yaml"} label="JSON or YAML input" placeholder="Paste JSON or YAML…" invalid={result?.ok === false} minHeight={520} />
        </ToolPanel>
        <ToolPanel
          title="Tree"
          actions={
            <>
              <CopyButton value={tree} disabled={!tree} tool={TOOL} />
              <DownloadButton content={tree} filename="tree.txt" disabled={!tree} tool={TOOL} />
            </>
          }
        >
          {result?.ok === false ? (
            <StatusMessage kind="error" title={result.message}>
              {result.line ? `Line ${result.line}, column ${result.column}` : null}
            </StatusMessage>
          ) : result?.ok ? (
            <p className="text-xs text-muted-foreground" role="status">
              Parsed as <strong>{result.value.format.toUpperCase()}</strong> · rendered as <strong>{result.value.mode === "schema" ? "JSON Schema" : "data"}</strong> — {result.value.reason}
            </p>
          ) : null}
          <pre
            tabIndex={0}
            aria-label="Tree output"
            className="min-h-[520px] max-h-[820px] overflow-auto rounded-md border bg-muted/40 p-3 font-mono text-[13px] leading-relaxed"
          >
            {tree || <span className="text-muted-foreground">The tree appears here as you type.</span>}
          </pre>
        </ToolPanel>
      </div>
    </div>
  );
}
