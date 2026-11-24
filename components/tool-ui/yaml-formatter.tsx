"use client";

import { useState } from "react";
import { Eraser, FileInput, ShieldCheck, WandSparkles } from "lucide-react";
import { CodeEditor } from "@/components/editors/code-editor";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { CopyButton } from "@/components/tools/copy-button";
import { DownloadButton } from "@/components/tools/download-button";
import { StatusMessage } from "@/components/tools/status-message";
import { ToolPanel, Toolbar } from "@/components/tools/tool-panel";
import { formatYaml, parseYamlSafe, type YamlIssue } from "@/features/devops/yaml";
import { checkInputSize } from "@/lib/limits";
import { track } from "@/lib/analytics";

const TOOL = "yaml-formatter";
const SAMPLE = `# Kubernetes deployment (sample)
apiVersion: apps/v1
kind: Deployment
metadata:
    name: web
    labels: {app: web, tier: frontend}
spec:
    replicas: 3
    template:
        spec:
            containers:
            - name: web
              image: "nginx:1.27"
              ports:
              - containerPort: 80
              env:
              - name: ENABLE_CACHE
                value: "true"   # quoted so it stays a string
`;

type Status = { kind: "error"; issues: YamlIssue[] } | { kind: "success"; title: string; warnings: YamlIssue[] } | null;

const where = (i: YamlIssue) => (i.line ? ` (line ${i.line}, column ${i.column})` : "");

export default function YamlFormatterTool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [indent, setIndent] = useState<2 | 4>(2);
  const [status, setStatus] = useState<Status>(null);

  const format = () => {
    const big = checkInputSize(input);
    if (big) return setStatus({ kind: "error", issues: [{ message: big }] });
    track("tool_execute", { tool: TOOL, action: "format" });
    const r = formatYaml(input, { indent });
    if (r.ok) {
      setOutput(r.value);
      setStatus({ kind: "success", title: `Valid YAML — ${r.documents} document${r.documents === 1 ? "" : "s"} formatted.`, warnings: r.warnings });
      track("tool_success", { tool: TOOL });
    } else {
      setOutput("");
      setStatus({ kind: "error", issues: r.errors });
      track("tool_error", { tool: TOOL });
    }
  };

  const validate = () => {
    const big = checkInputSize(input);
    if (big) return setStatus({ kind: "error", issues: [{ message: big }] });
    const r = parseYamlSafe(input);
    setStatus(r.ok ? { kind: "success", title: `Valid YAML — ${r.documents} document${r.documents === 1 ? "" : "s"}.`, warnings: r.warnings } : { kind: "error", issues: r.errors });
  };

  return (
    <div className="flex flex-col gap-4">
      <Toolbar>
        <Button onClick={format}>
          <WandSparkles /> Format
        </Button>
        <Button variant="secondary" onClick={validate}>
          <ShieldCheck /> Validate
        </Button>
        <div className="flex items-center gap-2 sm:ml-auto">
          <label htmlFor="yaml-indent" className="text-sm text-muted-foreground">
            Indent
          </label>
          <Select id="yaml-indent" value={indent} onChange={(e) => setIndent(Number(e.target.value) as 2 | 4)}>
            <option value={2}>2 spaces</option>
            <option value={4}>4 spaces</option>
          </Select>
        </div>
      </Toolbar>

      {status?.kind === "error" && (
        <StatusMessage kind="error" title={`Invalid YAML: ${status.issues[0].message}${where(status.issues[0])}`}>
          {status.issues.length > 1 && (
            <ul className="list-disc pl-4">
              {status.issues.slice(1, 6).map((i, n) => (
                <li key={n}>
                  {i.message}
                  {where(i)}
                </li>
              ))}
            </ul>
          )}
        </StatusMessage>
      )}
      {status?.kind === "success" && (
        <>
          <StatusMessage kind="success" title={status.title} />
          {status.warnings.length > 0 && (
            <StatusMessage kind="warning" title="Warnings">
              <ul className="list-disc pl-4">
                {status.warnings.slice(0, 5).map((w, n) => (
                  <li key={n}>
                    {w.message}
                    {where(w)}
                  </li>
                ))}
              </ul>
            </StatusMessage>
          )}
        </>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <ToolPanel
          title="Input YAML"
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
          <CodeEditor value={input} onChange={setInput} language="yaml" label="Input YAML" placeholder="Paste YAML…" minHeight={520} invalid={status?.kind === "error"} />
        </ToolPanel>
        <ToolPanel
          title="Formatted YAML"
          expandable
          actions={
            <>
              <CopyButton value={output} disabled={!output} tool={TOOL} />
              <DownloadButton content={output} filename="formatted.yaml" mime="application/yaml" disabled={!output} tool={TOOL} />
            </>
          }
        >
          <CodeEditor value={output} language="yaml" readOnly label="Formatted YAML" placeholder="Result appears here" minHeight={520} />
        </ToolPanel>
      </div>
    </div>
  );
}
