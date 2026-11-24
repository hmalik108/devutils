"use client";

import { useState } from "react";
import { Eraser, FileInput, Minimize2, WandSparkles } from "lucide-react";
import { CodeEditor } from "@/components/editors/code-editor";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CopyButton } from "@/components/tools/copy-button";
import { DownloadButton } from "@/components/tools/download-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel, Toolbar } from "@/components/tools/tool-panel";
import { formatHtml, minifyHtml, type HtmlIndent, type HtmlResult } from "@/features/code/html";
import { checkInputSize } from "@/lib/limits";
import { byteLength, formatBytes } from "@/lib/utils";
import { track } from "@/lib/analytics";

const TOOL = "html-formatter";
const SAMPLE = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Sample</title><style>body{font-family:system-ui;margin:0}.card{padding:1rem}</style></head><body><!-- main card --><div class="card"><h1>Hello   devutils</h1><p>Format <b>or</b> <i>minify</i> HTML.</p><ul><li><a href="/json-formatter">JSON</a></li><li><a href="/regex-tester">Regex</a></li></ul><pre>  preformatted
    text stays</pre></div><script>document.title = "Sample";</script></body></html>`;

export default function HtmlFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState<HtmlIndent>(2);
  const [status, setStatus] = useState<{ kind: "error" | "success"; title: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const apply = (r: HtmlResult, op: string) => {
    if (r.ok) {
      setOutput(r.value);
      const before = byteLength(input);
      const after = byteLength(r.value);
      setStatus({ kind: "success", title: op === "minify" ? `Minified: ${formatBytes(before)} → ${formatBytes(after)} (${before ? Math.round((1 - after / before) * 100) : 0}% smaller)` : "Formatted." });
      track("tool_success", { tool: TOOL, action: op });
    } else {
      setStatus({ kind: "error", title: r.error });
      track("tool_error", { tool: TOOL, action: op });
    }
  };

  const run = async (op: "format" | "minify") => {
    const big = checkInputSize(input, 2 * 1024 * 1024);
    if (big) return setStatus({ kind: "error", title: big });
    track("tool_execute", { tool: TOOL, action: op });
    if (op === "minify") return apply(minifyHtml(input), op);
    setBusy(true);
    try {
      apply(await formatHtml(input, indent), op);
    } catch {
      setStatus({ kind: "error", title: "The formatter could not be loaded. Check your connection and try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <Button onClick={() => run("format")} disabled={busy}>
          <WandSparkles /> {busy ? "Formatting…" : "Format"}
        </Button>
        <Button variant="secondary" onClick={() => run("minify")} disabled={busy}>
          <Minimize2 /> Minify
        </Button>
        <div className="flex items-center gap-2 sm:ml-auto">
          <label htmlFor="html-indent" className="text-sm text-muted-foreground">
            Indent
          </label>
          <Select id="html-indent" value={String(indent)} onChange={(e) => setIndent(e.target.value === "tab" ? "tab" : (Number(e.target.value) as 2 | 4))}>
            <option value="2">2 spaces</option>
            <option value="4">4 spaces</option>
            <option value="tab">Tab</option>
          </Select>
        </div>
      </Toolbar>
      {status && <StatusMessage kind={status.kind} title={status.title} />}
      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel
          title="Input HTML"
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
          <CodeEditor value={input} onChange={setInput} language="html" label="Input HTML" placeholder="Paste HTML…" minHeight={520} invalid={status?.kind === "error"} />
        </ToolPanel>
        <ToolPanel
          title="Output"
          actions={
            <>
              <CopyButton value={output} disabled={!output} tool={TOOL} />
              <DownloadButton content={output} filename="output.html" mime="text/html" disabled={!output} tool={TOOL} />
            </>
          }
        >
          <CodeEditor value={output} language="html" readOnly label="Output HTML" placeholder="Result appears here" minHeight={520} />
        </ToolPanel>
      </div>
    </div>
  );
}
