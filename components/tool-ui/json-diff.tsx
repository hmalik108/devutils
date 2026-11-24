"use client";

import { useState } from "react";
import { Eraser, FileInput, GitCompare, Minus, Plus, ArrowLeftRight } from "lucide-react";
import { CodeEditor } from "@/components/editors/code-editor";
import { Button } from "@/components/ui/button";
import { CopyButton } from "@/components/tools/copy-button";
import { DownloadButton } from "@/components/tools/download-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel, Toolbar } from "@/components/tools/tool-panel";
import { parseJson, type JsonParseError } from "@/features/json/format";
import { diffJson, diffToText, summarize, type DiffEntry } from "@/features/json/diff";
import { checkInputSize, WORKER_THRESHOLD_BYTES } from "@/lib/limits";
import { SupersededError, WorkerTimeoutError } from "@/lib/worker-client";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { useTaskWorker } from "./use-task-worker";
import { createJsonWorker, type JsonTask } from "./json-worker";

const TOOL = "json-diff";
const LEFT = `{\n  "name": "devutils",\n  "version": 1,\n  "features": ["format", "validate"],\n  "settings": { "theme": "light", "indent": 2 }\n}`;
const RIGHT = `{\n  "version": 2,\n  "name": "devutils",\n  "features": ["format"],\n  "settings": { "theme": "dark", "indent": 2 },\n  "public": true\n}`;

type DiffResponse =
  | { ok: true; value: { entries: DiffEntry[]; truncated: boolean } }
  | { ok: false; left: JsonParseError | null; right: JsonParseError | null };

const fmt = (v: unknown) => {
  const s = JSON.stringify(v);
  return s === undefined ? "undefined" : s.length > 200 ? s.slice(0, 197) + "…" : s;
};

const META = {
  added: { icon: Plus, label: "Added", cls: "bg-added" },
  removed: { icon: Minus, label: "Removed", cls: "bg-removed" },
  changed: { icon: ArrowLeftRight, label: "Changed", cls: "bg-changed" },
} as const;

function errText(e: JsonParseError) {
  return e.line ? `${e.message} (line ${e.line}, column ${e.column})` : e.message;
}

export default function JsonDiffTool() {
  const [left, setLeft] = useState("");
  const [right, setRight] = useState("");
  const [result, setResult] = useState<{ entries: DiffEntry[]; truncated: boolean } | null>(null);
  const [errors, setErrors] = useState<{ left: string | null; right: string | null; general: string | null }>({ left: null, right: null, general: null });
  const [busy, setBusy] = useState(false);
  const worker = useTaskWorker<JsonTask, DiffResponse>(createJsonWorker, 30_000);

  const compare = async () => {
    const big = checkInputSize(left) ?? checkInputSize(right);
    if (big) return setErrors({ left: null, right: null, general: big });
    track("tool_execute", { tool: TOOL });
    let res: DiffResponse;
    if (left.length + right.length < WORKER_THRESHOLD_BYTES) {
      const l = parseJson(left);
      const r = parseJson(right);
      res = l.ok && r.ok ? { ok: true, value: diffJson(l.value, r.value) } : { ok: false, left: l.ok ? null : l.error, right: r.ok ? null : r.error };
    } else {
      setBusy(true);
      try {
        res = await worker().run({ op: "diff", left, right });
      } catch (e) {
        if (!(e instanceof SupersededError)) setErrors({ left: null, right: null, general: e instanceof WorkerTimeoutError ? e.message : "Comparison failed." });
        return;
      } finally {
        setBusy(false);
      }
    }
    if (res.ok) {
      setErrors({ left: null, right: null, general: null });
      setResult(res.value);
      track("tool_success", { tool: TOOL });
    } else {
      setResult(null);
      setErrors({ left: res.left && errText(res.left), right: res.right && errText(res.right), general: null });
      track("tool_error", { tool: TOOL, action: "invalid_json" });
    }
  };

  const counts = result ? summarize(result.entries) : null;
  const report = result ? diffToText(result.entries) : "";

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <Button onClick={compare} disabled={busy}>
          <GitCompare /> Compare
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setLeft(LEFT); setRight(RIGHT); setResult(null); setErrors({ left: null, right: null, general: null }); }}>
          <FileInput /> Sample
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setLeft(""); setRight(""); setResult(null); setErrors({ left: null, right: null, general: null }); }}>
          <Eraser /> Clear
        </Button>
      </Toolbar>
      {errors.general && <StatusMessage kind="error" title={errors.general} />}

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel title="Original JSON (left)">
          <CodeEditor value={left} onChange={setLeft} language="json" label="Original JSON" placeholder="Paste the original JSON…" invalid={!!errors.left} minHeight={260} />
          {errors.left && <StatusMessage kind="error" title="Left JSON is invalid">{errors.left}</StatusMessage>}
        </ToolPanel>
        <ToolPanel title="Modified JSON (right)">
          <CodeEditor value={right} onChange={setRight} language="json" label="Modified JSON" placeholder="Paste the modified JSON…" invalid={!!errors.right} minHeight={260} />
          {errors.right && <StatusMessage kind="error" title="Right JSON is invalid">{errors.right}</StatusMessage>}
        </ToolPanel>
      </div>

      {result && counts && (
        <ToolPanel
          title="Differences"
          actions={
            <>
              <CopyButton value={report} tool={TOOL} label="Copy report" />
              <DownloadButton content={report} filename="json-diff.txt" tool={TOOL} />
            </>
          }
        >
          {result.entries.length === 0 ? (
            <StatusMessage kind="success" title="No differences — the documents are equivalent." />
          ) : (
            <>
              <p className="text-sm text-muted-foreground" role="status">
                {counts.added} added · {counts.removed} removed · {counts.changed} changed
                {result.truncated && " (showing the first 5,000)"}
              </p>
              <ul className="max-h-[480px] divide-y overflow-auto rounded-md border font-mono text-[13px]">
                {result.entries.map((e, i) => {
                  const m = META[e.kind];
                  const Icon = m.icon;
                  return (
                    <li key={i} className={cn("flex items-start gap-3 px-3 py-2", m.cls)}>
                      <Icon aria-hidden className="mt-0.5 size-4 shrink-0" />
                      <span className="sr-only">{m.label}:</span>
                      <div className="min-w-0 break-all">
                        <span className="font-semibold">{e.path}</span>
                        <span className="ml-2 text-xs font-sans text-muted-foreground">{m.label}</span>
                        <div className="mt-0.5">
                          {e.kind === "added" && fmt(e.right)}
                          {e.kind === "removed" && <span className="line-through decoration-1">{fmt(e.left)}</span>}
                          {e.kind === "changed" && (
                            <>
                              <span className="line-through decoration-1">{fmt(e.left)}</span> <span aria-hidden>→</span>
                              <span className="sr-only">changed to</span> {fmt(e.right)}
                            </>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </ToolPanel>
      )}
    </div>
  );
}
