"use client";

import { useState } from "react";
import { Braces, Eraser, FileInput, ListTree, Minimize2, ShieldCheck } from "lucide-react";
import { CodeEditor } from "@/components/editors/code-editor";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CopyButton } from "@/components/tools/copy-button";
import { DownloadButton } from "@/components/tools/download-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel, Toolbar } from "@/components/tools/tool-panel";
import { formatJson, minifyJson, flattenJson, validateJson, type Indent, type JsonResult } from "@/features/json/format";
import { checkInputSize, WORKER_THRESHOLD_BYTES } from "@/lib/limits";
import { WorkerTimeoutError, SupersededError } from "@/lib/worker-client";
import { track } from "@/lib/analytics";
import { useTaskWorker } from "./use-task-worker";
import { createJsonWorker, type JsonTask } from "./json-worker";

const TOOL = "json-formatter";
const SAMPLE = `{"id":1024,"name":"devutils","active":true,"tags":["json","formatter"],"owner":{"name":"Ada","email":"ada@example.com"},"limits":{"maxBytes":5242880,"ratio":0.75},"deletedAt":null}`;

type Op = "format" | "minify" | "flatten";
type Status = { kind: "error"; title: string; detail?: string } | { kind: "success"; title: string } | { kind: "info"; title: string } | null;

export default function JsonFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState<Indent>(2);
  const [sortKeys, setSortKeys] = useState(false);
  const [status, setStatus] = useState<Status>(null);
  const [busy, setBusy] = useState(false);
  const worker = useTaskWorker<JsonTask, JsonResult>(createJsonWorker, 20_000);

  const showResult = (r: JsonResult, op: Op) => {
    if (r.ok) {
      setOutput(r.value);
      setStatus({ kind: "success", title: op === "minify" ? "Valid JSON — minified." : op === "flatten" ? "Valid JSON — flattened." : "Valid JSON — formatted." });
      track("tool_success", { tool: TOOL, action: op });
    } else {
      setOutput("");
      const where = r.error.line ? `Line ${r.error.line}, column ${r.error.column}` : undefined;
      setStatus({ kind: "error", title: r.error.message, detail: where });
      track("tool_error", { tool: TOOL, action: "invalid_json" });
    }
  };

  const run = async (op: Op) => {
    const tooBig = checkInputSize(input);
    if (tooBig) return setStatus({ kind: "error", title: tooBig });
    track("tool_execute", { tool: TOOL, action: op });
    if (input.length < WORKER_THRESHOLD_BYTES) {
      showResult(op === "format" ? formatJson(input, indent, sortKeys) : op === "minify" ? minifyJson(input) : flattenJson(input, indent), op);
      return;
    }
    setBusy(true);
    setStatus({ kind: "info", title: "Processing large input…" });
    try {
      const task: JsonTask = op === "format" ? { op, text: input, indent, sortKeys } : op === "minify" ? { op, text: input } : { op, text: input, indent };
      showResult(await worker().run(task), op);
    } catch (e) {
      if (e instanceof SupersededError) return;
      setStatus({ kind: "error", title: e instanceof WorkerTimeoutError ? e.message : "Processing failed." });
    } finally {
      setBusy(false);
    }
  };

  const validate = () => {
    const r = validateJson(input);
    if (r.valid) setStatus({ kind: "success", title: "Valid JSON." });
    else setStatus({ kind: "error", title: r.error.message, detail: r.error.line ? `Line ${r.error.line}, column ${r.error.column}` : undefined });
  };

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <Button onClick={() => run("format")} disabled={busy}>
          <Braces /> Format
        </Button>
        <Button variant="secondary" onClick={() => run("minify")} disabled={busy}>
          <Minimize2 /> Minify
        </Button>
        <Button variant="secondary" onClick={() => run("flatten")} disabled={busy}>
          <ListTree /> Flatten
        </Button>
        <Button variant="secondary" onClick={validate} disabled={busy}>
          <ShieldCheck /> Validate
        </Button>
        <div className="flex items-center gap-2 sm:ml-auto">
          <label htmlFor="json-indent" className="text-sm text-muted-foreground">
            Indent
          </label>
          <Select id="json-indent" value={String(indent)} onChange={(e) => setIndent(e.target.value === "tab" ? "tab" : (Number(e.target.value) as 2 | 4))}>
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </Select>
          <Checkbox label="Sort keys" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} />
        </div>
      </Toolbar>

      {status && (
        <StatusMessage kind={status.kind} title={status.title}>
          {status.kind === "error" && status.detail}
        </StatusMessage>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel
          title="Input JSON"
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={() => { setInput(SAMPLE); setStatus(null); }}>
                <FileInput /> Sample
              </Button>
              <Button variant="ghost" size="sm" onClick={() => { setInput(""); setOutput(""); setStatus(null); }}>
                <Eraser /> Clear
              </Button>
            </>
          }
        >
          <CodeEditor value={input} onChange={setInput} language="json" label="Input JSON" placeholder="Paste JSON here…" invalid={status?.kind === "error"} minHeight={320} />
        </ToolPanel>
        <ToolPanel
          title="Output"
          actions={
            <>
              <CopyButton value={output} disabled={!output} tool={TOOL} />
              <DownloadButton content={output} filename="formatted.json" mime="application/json" disabled={!output} tool={TOOL} />
            </>
          }
        >
          <CodeEditor value={output} language="json" readOnly label="Output JSON" placeholder="Result appears here" minHeight={320} />
        </ToolPanel>
      </div>
    </div>
  );
}
